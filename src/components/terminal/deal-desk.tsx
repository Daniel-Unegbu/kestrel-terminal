import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, Send, Square, X } from "lucide-react";
import { askDealDesk, synthesizeSpeech, transcribeAudio } from "@/lib/voice.functions";
import { SourceBadges } from "./source-badge";
import { useTerminal } from "./terminal-context";

type Phase = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const SUGGESTED =
  "What are the top two control gaps and fraud risks for this system, and which EISAA pillar should lead?";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function DealDeskDock() {
  const { activeDossier, deskOpen, setDeskOpen } = useTerminal();
  const transcribe = useServerFn(transcribeAudio);
  const ask = useServerFn(askDealDesk);
  const tts = useServerFn(synthesizeSpeech);

  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    leadPillar: string;
    sourceRefs: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stopRequested = useRef(false);

  const speak = useCallback(
    async (text: string) => {
      setPhase("speaking");
      const res = await tts({ data: { text } }).catch(() => null);
      if (res?.ok) {
        const a = new Audio(`data:${res.mime};base64,${res.audioBase64}`);
        audio.current = a;
        a.onended = () => setPhase("idle");
        try {
          await a.play();
          return;
        } catch {
          /* fall through to browser voice */
        }
      }
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => setPhase("idle");
        window.speechSynthesis.speak(u);
      } else setPhase("idle");
    },
    [tts],
  );

  const submit = useCallback(
    async (q: string) => {
      if (q.trim().length < 3) return;
      setError(null);
      setAnswer(null);
      setPhase("thinking");
      const res = await ask({
        data: { question: q, dossierJson: JSON.stringify(activeDossier) },
      }).catch(() => null);
      if (!res?.ok) {
        setError(res && !res.ok ? res.error : "The AuditDesk couldn't answer right now.");
        return setPhase("idle");
      }
      setAnswer({ answer: res.answer, leadPillar: res.leadPillar, sourceRefs: res.sourceRefs });
      void speak(res.spoken);
    },
    [activeDossier, ask, speak],
  );

  const startRecording = useCallback(async () => {
    if (phase === "recording") return;
    setError(null);
    stopRequested.current = false;
    audio.current?.pause();
    window.speechSynthesis?.cancel();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 2000) {
          setPhase("idle");
          return setError("Hold to speak a little longer.");
        }
        setPhase("transcribing");
        const b64 = await blobToBase64(blob);
        const res = await transcribe({ data: { audioBase64: b64, mime: blob.type } }).catch(
          () => null,
        );
        if (!res?.ok || !res.transcript) {
          setPhase("idle");
          return setError("Couldn't hear that clearly — try again or type your question.");
        }
        setQuestion(res.transcript);
        void submit(res.transcript);
      };
      recorder.current = rec;
      rec.start();
      setPhase("recording");
      // The key/pointer may have been released while the mic was still opening.
      if (stopRequested.current) {
        stopRequested.current = false;
        rec.stop();
      }
    } catch {
      setError("Microphone unavailable — type your question instead.");
    }
  }, [phase, submit, transcribe]);

  const stopRecording = useCallback(() => {
    stopRequested.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  // Hold Space to talk — only while the AuditDesk is open, so Space still scrolls the page.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
    const down = (e: KeyboardEvent) => {
      if (
        !deskOpen ||
        e.code !== "Space" ||
        e.repeat ||
        isTyping(e.target) ||
        document.querySelector("[role=dialog]")
      )
        return;
      e.preventDefault();
      void startRecording();
    };
    const up = (e: KeyboardEvent) => {
      if (!deskOpen || e.code !== "Space" || isTyping(e.target)) return;
      stopRecording();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [deskOpen, startRecording, stopRecording]);

  const busy = phase === "transcribing" || phase === "thinking";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 no-print">
      <AnimatePresence>
        {deskOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="panel w-[min(420px,calc(100vw-2.5rem))] overflow-hidden !bg-popover"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Ask the AuditDesk</div>
                <div className="eyebrow !text-[10px] mt-0.5 truncate">
                  Context · {activeDossier.entityName}
                </div>
              </div>
              <button
                onClick={() => setDeskOpen(false)}
                aria-label="Close AuditDesk"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto p-4">
              {!answer && !busy && !question && (
                <button
                  onClick={() => {
                    setQuestion(SUGGESTED);
                    void submit(SUGGESTED);
                  }}
                  className="w-full rounded-md border border-dashed border-hairline-strong p-3 text-left text-[13px] text-muted-foreground hover:border-gold/50 hover:text-foreground"
                >
                  “{SUGGESTED}”
                </button>
              )}
              {question && (
                <div className="ml-8 rounded-md bg-elevated p-3 text-[13px]">
                  <div className="eyebrow !text-[9.5px] mb-1">You asked</div>
                  {question}
                </div>
              )}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-gold" />
                  <span className="num">
                    {phase === "transcribing"
                      ? "Transcribing · Voice Agent"
                      : "Reasoning over dossier · Research Agent"}
                  </span>
                </div>
              )}
              {answer && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md border border-gold/30 bg-gold/5 p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="eyebrow !text-[9.5px] text-gold">
                      Lead: {answer.leadPillar}
                    </span>
                    {phase === "speaking" && (
                      <span className="flex h-3 items-center gap-[2px]">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className="h-full w-[2px] rounded-full bg-gold animate-wave"
                            style={{ animationDelay: `${i * 0.12}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed">{answer.answer}</p>
                  <div className="mt-2">
                    <SourceBadges refs={answer.sourceRefs} sources={activeDossier.sources} />
                  </div>
                </motion.div>
              )}
              {error && <p className="text-xs text-crimson">{error}</p>}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit(question);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type a question, or hold Space to talk"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-gold/50"
              />
              <button
                type="submit"
                disabled={busy}
                aria-label="Send question"
                className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-gold disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onPointerDown={(e) => {
          e.preventDefault();
          if (!deskOpen) return setDeskOpen(true);
          void startRecording();
        }}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        aria-label="Hold to ask the AuditDesk"
        className={`group flex items-center gap-2.5 rounded-full border py-2 pl-2 pr-4 shadow-2xl backdrop-blur transition ${
          phase === "recording"
            ? "border-crimson/60 bg-crimson/15"
            : "border-hairline-strong bg-popover/90 hover:border-azure/60"
        }`}
      >
        <span
          className={`flex size-9 items-center justify-center rounded-full ${phase === "recording" ? "bg-crimson text-destructive-foreground" : "bg-azure/15 text-azure"}`}
        >
          {phase === "recording" ? (
            <Square className="size-3.5" />
          ) : busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mic className="size-4" />
          )}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-medium">
            {phase === "recording" ? "Listening… release to send" : "Ask the AuditDesk"}
          </span>
          <span className="num block text-[10px] text-muted-foreground">
            {deskOpen ? "Hold to talk · or hold Space" : "Voice copilot"}
          </span>
        </span>
      </button>
    </div>
  );
}
