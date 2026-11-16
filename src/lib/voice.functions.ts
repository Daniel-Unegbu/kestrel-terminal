import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TtsResult = { ok: true; audioBase64: string; mime: string } | { ok: false; error: string };

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data }): Promise<TtsResult> => {
    const key = process.env["DEEPGRAM_API_KEY"];
    if (!key) return { ok: false, error: "voice-not-configured" };
    try {
      const res = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-orion-en&encoding=mp3", {
        method: "POST",
        headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text }),
      });
      if (!res.ok) {
        console.error("Deepgram TTS", res.status, await res.text().catch(() => ""));
        return { ok: false, error: "tts-failed" };
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return { ok: true, audioBase64: buf.toString("base64"), mime: "audio/mpeg" };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "tts-failed" };
    }
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ audioBase64: z.string().min(10).max(8_000_000), mime: z.string().max(60) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; transcript: string } | { ok: false; error: string }> => {
    const key = process.env["DEEPGRAM_API_KEY"];
    if (!key) return { ok: false, error: "voice-not-configured" };
    try {
      const res = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true", {
        method: "POST",
        headers: { Authorization: `Token ${key}`, "Content-Type": data.mime.split(";")[0] || "audio/webm" },
        body: Buffer.from(data.audioBase64, "base64"),
      });
      if (!res.ok) {
        console.error("Deepgram STT", res.status, await res.text().catch(() => ""));
        return { ok: false, error: "stt-failed" };
      }
      const json = (await res.json()) as {
        results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
      };
      const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
      return { ok: true, transcript };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "stt-failed" };
    }
  });

export type DealDeskAnswer =
  | { ok: true; answer: string; spoken: string; leadDivision: string; sourceRefs: number[] }
  | { ok: false; error: string };

export const askDealDesk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ question: z.string().trim().min(3).max(600), dossierJson: z.string().max(60_000) }).parse(d),
  )
  .handler(async ({ data }): Promise<DealDeskAnswer> => {
    const { generateChatCompletion } = await import("@lovable.dev/ai-gateway");
    const { extractText, stripFences } = await import("./research.server");
    try {
      const res = await generateChatCompletion({
        model: "google/gemini-3.8-flash",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are FAB\'s Deal Desk copilot for relationship managers. Answer ONLY from the dossier JSON provided. Be crisp and institutional. Return JSON: {"answer": string (3-5 sentences, cite sources inline as [Source N] using 1-based numbering of dossier.sources), "spoken": string (exactly 2 short sentences for text-to-speech, no brackets), "leadDivision": string (one FAB division), "sourceRefs": number[] (0-based indexes into dossier.sources)}',
          },
          { role: "user", content: `DOSSIER:\n${data.dossierJson}\n\nQUESTION: ${data.question}` },
        ],
      });
      const parsed = z
        .object({
          answer: z.string(),
          spoken: z.string().catch(""),
          leadDivision: z.string().catch(""),
          sourceRefs: z.array(z.coerce.number().int()).catch([]),
        })
        .parse(JSON.parse(stripFences(extractText(res.choices?.[0]?.message?.content))));
      return { ok: true, ...parsed, spoken: parsed.spoken || parsed.answer };
    } catch (e) {
      console.error("Deal desk failed", e);
      return { ok: false, error: "The Deal Desk couldn't answer right now. Please try again." };
    }
  });
