import { getPendingTtsRequests, updateTtsStatus, type Database } from "@focus-forge/api-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KokoroTTS as KokoroTTSType } from "kokoro-js";

const POLL_INTERVAL_MS = 1000;
const MODEL_ID = "onnx-community/Kokoro-82M-ONNX";
// af_heart is one of the highest-rated voices in the Kokoro pack (natural,
// warm American female) — af_sky sounded noticeably more robotic.
const VOICE = "af_heart";

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
    try {
      const tts = await loadModel();
      const audio = await tts.generate(text, { voice: VOICE });
      const audioBase64 = Buffer.from(audio.toWav()).toString("base64");
      await updateTtsStatus(supabase, id, { status: "completed", audioBase64 });
      console.log(`[ttsRunner] ${id} completed`);
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
