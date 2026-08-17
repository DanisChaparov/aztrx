import { getPendingTtsRequests, updateTtsStatus, type Database } from "@aztrx/api-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KokoroTTS as KokoroTTSType } from "kokoro-js";

const POLL_INTERVAL_MS = 5000;
// Was 1000ms (1s) — same reasoning as chatRunner: TTS generation takes
// multiple seconds, so polling 5× less often adds negligible latency
// (user won't perceive ~4s extra when generation itself takes seconds)
// while meaningfully reducing churn.
const MODEL_ID = "onnx-community/Kokoro-82M-ONNX";
// Calm British male, the register people mean when they say "Jarvis". The
// other three in the pack are bm_lewis, bm_daniel and bm_fable — swap the
// string to change voice, no other code depends on it.
const VOICE = "bm_george";
// A one-line status update ("streak's at 2 days") read at the same pace as a
// full explanation drags — short replies get a slightly quicker, punchier
// delivery instead of every reply sounding identical regardless of length.
const SHORT_REPLY_WORD_THRESHOLD = 15;
const SHORT_REPLY_SPEED = 1.15;
const DEFAULT_SPEED = 1.0;

function speedFor(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return wordCount <= SHORT_REPLY_WORD_THRESHOLD ? SHORT_REPLY_SPEED : DEFAULT_SPEED;
}

let modelPromise: Promise<KokoroTTSType> | null = null;

async function loadModel(): Promise<KokoroTTSType> {
  if (!modelPromise) {
    // Pure-ESM, WASM/ONNX-asset-loading package — dynamic import() from this
    // CJS-bundled main process, same reason as active-win (see build.mjs).
    modelPromise = import("kokoro-js").then(({ KokoroTTS }) =>
      KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "cpu" })
    );
  }
  return modelPromise;
}

/** Kicked off once at app startup so the model is already warm by the time the
 *  user's first chat reply needs to be spoken, instead of eating the load time
 *  (several seconds to tens of seconds) on the critical path of that request. */
export function warmTtsModel(): void {
  loadModel().catch((err) => console.error("[ttsRunner] warm-up failed:", err));
}

export function startTtsRunner(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;
  const inFlight = new Set<string>();

  async function poll() {
    if (stopped) return;
    try {
      const pending = await getPendingTtsRequests(supabase);
      for (const req of pending) {
        if (inFlight.has(req.id)) continue;
        inFlight.add(req.id);
        handleRequest(req.id, req.text).finally(() => inFlight.delete(req.id));
      }
    } catch (err) {
      console.error("[ttsRunner] poll failed:", err);
    }
  }

  async function handleRequest(id: string, text: string) {
    console.log(`[ttsRunner] generating audio for ${id} (${text.length} chars)...`);
    const t0 = Date.now();
    try {
      const tts = await loadModel();
      const t1 = Date.now();
      const audio = await tts.generate(text, { voice: VOICE, speed: speedFor(text) });
      const t2 = Date.now();
      const audioBase64 = Buffer.from(audio.toWav()).toString("base64");
      const t3 = Date.now();
      console.log(`[ttsRunner] ${id} encoded to base64 (${audioBase64.length} chars) in ${t3 - t2}ms, writing to Supabase...`);
      await updateTtsStatus(supabase, id, { status: "completed", audioBase64 });
      console.log(
        `[ttsRunner] ${id} completed — model wait: ${t1 - t0}ms, generate: ${t2 - t1}ms, encode: ${t3 - t2}ms, ` +
          `db write: ${Date.now() - t3}ms, total: ${Date.now() - t0}ms`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ttsRunner] ${id} failed:`, message);
      await updateTtsStatus(supabase, id, { status: "failed", error: message }).catch(() => {});
    }
  }

  const id = setInterval(poll, POLL_INTERVAL_MS);
  poll();
  return () => {
    stopped = true;
    clearInterval(id);
  };
}
