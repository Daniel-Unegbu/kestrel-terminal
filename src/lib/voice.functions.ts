import { invokeEdge } from "./edge";

export type TtsResult =
  { ok: true; audioBase64: string; mime: string } | { ok: false; error: string };

export type DealDeskAnswer =
  | { ok: true; answer: string; spoken: string; leadDivision: string; sourceRefs: number[] }
  | { ok: false; error: string };

export const synthesizeSpeech = async ({
  data,
}: {
  data: { text: string };
}): Promise<TtsResult> => {
  try {
    return await invokeEdge<TtsResult>("text-to-speech", data);
  } catch (error) {
    console.error("Text-to-speech failed", error);
    return { ok: false, error: "tts-failed" };
  }
};

export const transcribeAudio = async ({
  data,
}: {
  data: { audioBase64: string; mime: string };
}): Promise<{ ok: true; transcript: string } | { ok: false; error: string }> => {
  try {
    return await invokeEdge<{ ok: true; transcript: string } | { ok: false; error: string }>(
      "speech-to-text",
      data,
    );
  } catch (error) {
    console.error("Speech-to-text failed", error);
    return { ok: false, error: "stt-failed" };
  }
};

export const askDealDesk = async ({
  data,
}: {
  data: { question: string; dossierJson: string };
}): Promise<DealDeskAnswer> => {
  try {
    return await invokeEdge<DealDeskAnswer>("deal-desk", data);
  } catch (error) {
    console.error("Deal desk failed", error);
    return {
      ok: false,
      error: "The Deal Desk couldn't answer right now. Please try again.",
    };
  }
};
