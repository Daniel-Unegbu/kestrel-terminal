import { invokeEdge, invokeEdgeAudio } from "./edge";

export type TtsResult =
  { ok: true; audioBase64: string; mime: string } | { ok: false; error: string };

export type DealDeskAnswer =
  | { ok: true; answer: string; spoken: string; leadDivision: string; sourceRefs: number[] }
  | { ok: false; error: string };

interface DealDeskQaResponse {
  ok?: boolean;
  transcript?: string;
  answerText?: string;
  spokenText?: string;
  answerSource?: string;
  leadDivision?: string;
  sourceUrls?: string[];
  results?: Array<{ title: string; snippet: string; url: string }>;
  error?: string;
}

interface DossierLite {
  entityName?: string;
  fabDivisionRouting?: Array<{ division?: string }>;
  sources?: Array<{ url?: string }>;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function firstSentences(text: string, limit = 320): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  const slice = trimmed.slice(0, limit);
  const cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return cut > 80 ? slice.slice(0, cut + 1) : `${slice.trimEnd()}…`;
}

/**
 * voice-brief: Deepgram Aura speaks the script Gemini already wrote.
 * The function returns raw MP3; the UI expects a base64 data URL.
 */
export const synthesizeSpeech = async ({
  data,
}: {
  data: { text: string };
}): Promise<TtsResult> => {
  try {
    const { blob, mime } = await invokeEdgeAudio("voice-brief", { script: data.text });
    return { ok: true, audioBase64: await blobToBase64(blob), mime };
  } catch (error) {
    console.error("Text-to-speech failed", error);
    return { ok: false, error: "tts-failed" };
  }
};

/**
 * Deepgram Nova transcription. The Deal Desk UI transcribes first, then asks,
 * so this calls dealdesk-qa in transcribe-only mode (it is the only function
 * that touches Deepgram speech-to-text).
 */
export const transcribeAudio = async ({
  data,
}: {
  data: { audioBase64: string; mime: string };
}): Promise<{ ok: true; transcript: string } | { ok: false; error: string }> => {
  try {
    const res = await invokeEdge<DealDeskQaResponse>("dealdesk-qa", {
      audioBase64: data.audioBase64,
      mime: data.mime,
      transcribeOnly: true,
    });
    if (!res?.ok || !res.transcript) return { ok: false, error: res?.error ?? "stt-failed" };
    return { ok: true, transcript: res.transcript };
  } catch (error) {
    console.error("Speech-to-text failed", error);
    return { ok: false, error: "stt-failed" };
  }
};

/**
 * dealdesk-qa: dossier answers for client-file questions, SerpAPI Google search
 * for everything else (no Gemini). The edge function returns a single answer
 * plus the lead division and source URLs; those map onto the UI's shape.
 */
export const askDealDesk = async ({
  data,
}: {
  data: { question: string; dossierJson: string };
}): Promise<DealDeskAnswer> => {
  let dossier: DossierLite = {};
  try {
    dossier = JSON.parse(data.dossierJson) as DossierLite;
  } catch {
    dossier = {};
  }

  try {
    const res = await invokeEdge<DealDeskQaResponse>("dealdesk-qa", {
      questionText: data.question,
      entityName: dossier.entityName ?? "",
      dossierJson: data.dossierJson,
    });

    if (!res?.ok || !res.answerText) {
      return {
        ok: false,
        error:
          res?.error === "search-failed"
            ? "The Search Agent couldn't reach the market right now. Please try again."
            : "The Deal Desk couldn't answer right now. Please try again.",
      };
    }

    // Edge returns dossier source URLs; turn them into indices into the
    // dossier's source list so the citation badges line up.
    const sourceRefs = (res.sourceUrls ?? [])
      .map((url) => (dossier.sources ?? []).findIndex((source) => source?.url === url))
      .filter((index) => index >= 0);

    return {
      ok: true,
      answer: res.answerText,
      spoken: res.spokenText ?? firstSentences(res.answerText),
      leadDivision:
        res.leadDivision ?? dossier.fabDivisionRouting?.[0]?.division ?? "Global Corporate Finance",
      sourceRefs,
    };
  } catch (error) {
    console.error("Deal desk failed", error);
    const detail = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: detail
        ? `The Deal Desk couldn't answer right now (${detail}). Please try again.`
        : "The Deal Desk couldn't answer right now. Please try again.",
    };
  }
};
