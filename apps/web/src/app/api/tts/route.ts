import { NextResponse } from "next/server";
import { getTtsRequestById, queueTtsRequest } from "@aztrx/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";
const MAX_TEXT_LENGTH = 2000;
const KOKORO_POLL_INTERVAL_MS = 1000;
const KOKORO_TIMEOUT_MS = 30_000;

// Resolved once per warm server instance rather than on every request —
// listing voices is an extra round trip we don't need to repeat constantly.
let cachedVoiceId: string | null = null;

async function resolveVoiceId(apiKey: string): Promise<string | null> {
  const configured = process.env.ELEVENLABS_VOICE_ID;
  if (configured) return configured;
  if (cachedVoiceId) return cachedVoiceId;

  const res = await fetch(`${ELEVENLABS_BASE_URL}/v2/voices?category=premade&voice_type=default&page_size=1`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { voices: { voice_id: string }[] };
  cachedVoiceId = data.voices[0]?.voice_id ?? null;
  return cachedVoiceId;
}

async function handleElevenLabs(apiKey: string, text: string): Promise<NextResponse> {
  const voiceId = await resolveVoiceId(apiKey);
  if (!voiceId) {
    return NextResponse.json({ error: "No ElevenLabs voice available on this account" }, { status: 502 });
  }

  const ttsRes = await fetch(`${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!ttsRes.ok || !ttsRes.body) {
    const detail = await ttsRes.text().catch(() => "");
    return NextResponse.json({ error: `ElevenLabs request failed: ${detail.slice(0, 300)}` }, { status: 502 });
  }

  return new NextResponse(ttsRes.body, { headers: { "Content-Type": "audio/mpeg" } });
}

/** No API key configured — relayed to the desktop widget's local, free Kokoro TTS instead. */
async function handleKokoro(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  userId: string,
  text: string
): Promise<NextResponse> {
  const request = await queueTtsRequest(supabase, { userId, text });

  const deadline = Date.now() + KOKORO_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, KOKORO_POLL_INTERVAL_MS));
    const current = await getTtsRequestById(supabase, request.id);
    if (!current || current.status === "pending") continue;

    if (current.status === "completed" && current.audioBase64) {
      const audioBuffer = Buffer.from(current.audioBase64, "base64");
      return new NextResponse(audioBuffer, { headers: { "Content-Type": "audio/wav" } });
    }
    return NextResponse.json({ error: current.error ?? "Local TTS failed" }, { status: 502 });
  }

  return NextResponse.json(
    { error: "Desktop widget didn't respond in time — is it running and signed in?" },
    { status: 504 }
  );
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = (await request.json()) as { text?: string };
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const trimmedText = text.slice(0, MAX_TEXT_LENGTH);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) return handleElevenLabs(apiKey, trimmedText);
  return handleKokoro(supabase, user.id, trimmedText);
}
