import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play } from "lucide-react";
import { synthesizeSpeech } from "@/lib/voice.functions";

const audioCache = new Map<string, string>();

export function AudioBrief({
  script,
  cacheKey,
  isPreset,
}: {
  script: string;
  cacheKey: string;
  isPreset: boolean;
}) {
  const tts = useServerFn(synthesizeSpeech);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState<"preset" | "neural" | "browser" | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
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
    setPlaybackError(null);
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
      if (engine !== "browser") audioRef.current?.pause();
      else window.speechSynthesis.pause();
      return setState("paused");
    }
    if (state === "paused") {
      if (engine !== "browser") await audioRef.current?.play();
      else window.speechSynthesis.resume();
      return setState("playing");
    }
    setState("loading");
    setPlaybackError(null);

    let src: string | undefined;
    if (isPreset) {
      src = "/audio/lead-auditor-brief.mp3";
      setEngine("preset");
    } else {
      src = audioCache.get(cacheKey);
      if (!src) {
        const res = await tts({ data: { text: script } }).catch(() => null);
        if (res?.ok) {
          src = `data:${res.mime};base64,${res.audioBase64}`;
          audioCache.set(cacheKey, src);
        }
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
    if (!isPreset) setEngine("neural");
    try {
      await audio.play();
      setState("playing");
    } catch {
      if (isPreset) {
        setPlaybackError("Couldn't play the preset audio brief.");
        setState("idle");
      } else {
        playBrowser();
      }
    }
  };

  const activeWord = Math.floor(progress * words.length);
  const showTranscript = state !== "idle" || progress > 0;

  return (
    <div className="panel top-hairline overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={start}
          aria-label={
            state === "playing" ? "Pause audio brief" : "Play 60-second Lead Auditor brief"
          }
          className="sheen flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_0_38px_-8px_oklch(0.8_0.13_90/75%)]"
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
            {engine === "preset"
              ? "Preset MP3 · Lead Auditor brief"
              : engine === "browser"
                ? "Browser voice fallback"
                : "Voice Agent · lead auditor voice"}
          </div>
        </div>
        <div className="flex h-8 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-colors ${state === "playing" ? "bg-gold shadow-[0_0_10px_oklch(0.8_0.13_90/80%)] animate-wave" : "bg-white/15"}`}
              style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 7) * 0.09}s` }}
            />
          ))}
        </div>
      </div>
      <div className="h-px bg-white/[0.07]">
        <div
          className="h-px bg-gradient-to-r from-gold/60 via-gold to-gold/60 shadow-[0_0_10px_oklch(0.8_0.13_90/80%)] transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {playbackError && <p className="px-3 py-2 text-xs text-crimson">{playbackError}</p>}
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
