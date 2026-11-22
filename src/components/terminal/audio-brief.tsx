import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play } from "lucide-react";
import { synthesizeSpeech } from "@/lib/voice.functions";

const audioCache = new Map<string, string>();

export function AudioBrief({ script, cacheKey }: { script: string; cacheKey: string }) {
  const tts = useServerFn(synthesizeSpeech);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState<"neural" | "browser" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState("idle");
    setProgress(0);
  }, [cacheKey]);

  const playBrowser = () => {
    const synth = window.speechSynthesis;
    if (!synth) return setState("idle");
    synth.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 1.02;
    const voice = synth
      .getVoices()
      .find((v) => /en-(GB|US)/.test(v.lang) && /male|daniel|george|alex/i.test(v.name));
    if (voice) u.voice = voice;
    u.onboundary = (e) => setProgress(Math.min(1, e.charIndex / script.length));
    u.onend = () => {
      setState("idle");
      setProgress(1);
    };
    setEngine("browser");
    setState("playing");
    synth.speak(u);
  };

  const start = async () => {
    if (state === "playing") {
      if (engine === "neural") audioRef.current?.pause();
      else window.speechSynthesis.pause();
      return setState("paused");
    }
    if (state === "paused") {
      if (engine === "neural") await audioRef.current?.play();
      else window.speechSynthesis.resume();
      return setState("playing");
    }
    setState("loading");
    let src = audioCache.get(cacheKey);
    if (!src) {
      const res = await tts({ data: { text: script } }).catch(() => null);
      if (res?.ok) {
        src = `data:${res.mime};base64,${res.audioBase64}`;
        audioCache.set(cacheKey, src);
      }
    }
    if (!src) return playBrowser();
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.ontimeupdate = () => audio.duration && setProgress(audio.currentTime / audio.duration);
    audio.onended = () => {
      setState("idle");
      setProgress(1);
    };
    setEngine("neural");
    try {
      await audio.play();
      setState("playing");
    } catch {
      playBrowser();
    }
  };

  const activeWord = Math.floor(progress * words.length);
  const showTranscript = state !== "idle" || progress > 0;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={start}
          aria-label={
            state === "playing" ? "Pause audio brief" : "Play 60-second Lead Auditor brief"
          }
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-gold-foreground shadow-gold transition hover:brightness-110"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "playing" ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4 translate-x-px" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Play 60s Lead Auditor Brief</div>
          <div className="eyebrow !text-[10px] mt-0.5">
            {engine === "browser" ? "Browser voice fallback" : "Voice Agent · lead auditor voice"}
          </div>
        </div>
        <div className="flex h-8 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${state === "playing" ? "bg-gold animate-wave" : "bg-hairline-strong"}`}
              style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 7) * 0.09}s` }}
            />
          ))}
        </div>
      </div>
      <div className="h-px bg-border">
        <div
          className="h-px bg-gold transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {showTranscript && (
        <p className="max-h-36 overflow-y-auto p-3 text-[13px] leading-relaxed text-muted-foreground">
          {words.map((w, i) => (
            <span
              key={i}
              className={
                i === activeWord && state === "playing"
                  ? "rounded bg-gold/20 text-foreground"
                  : i < activeWord
                    ? "text-foreground/90"
                    : ""
              }
            >
              {w}{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
