"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 50_000;

// The Web Speech API has no official TS lib types; this covers just what's used here.
interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean } };
  resultIndex: number;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const ORB_STATE_STYLE: Record<OrbState, { color: string; ringDuration: number; coreDuration: number }> = {
  idle: { color: "#8b74ff", ringDuration: 3.2, coreDuration: 2.4 },
  listening: { color: "#ff6b6b", ringDuration: 1, coreDuration: 0.8 },
  thinking: { color: "#8b74ff", ringDuration: 1.4, coreDuration: 1.6 },
  speaking: { color: "#5a39f0", ringDuration: 1.8, coreDuration: 1.1 },
};

/** The always-present visual identity of the assistant — a breathing, glowing
 *  orb whose animation and color shift with what it's actually doing, instead
 *  of a static icon. Used both small (the floating launcher) and large (the
 *  panel's primary control) so press-to-talk always feels like the same thing. */
function KarnezzOrb({ size, state }: { size: number; state: OrbState }) {
  const { color, ringDuration, coreDuration } = ORB_STATE_STYLE[state];
  const Icon = state === "listening" ? Mic : state === "speaking" ? Volume2 : Sparkles;

  return (
    <div style={{ width: size, height: size }} className="relative flex shrink-0 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)` }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: ringDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.74,
          height: size * 0.74,
          background: `linear-gradient(135deg, ${color}, #5a39f0)`,
          boxShadow: `0 0 ${size * 0.3}px ${color}88`,
        }}
        animate={state === "thinking" ? { rotate: 360 } : { scale: [1, 1.07, 1] }}
        transition={
          state === "thinking"
            ? { duration: coreDuration, repeat: Infinity, ease: "linear" }
            : { duration: coreDuration, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <Icon size={size * 0.3} className="relative z-10 text-white" />
    </div>
  );
}

export function AssistantPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTranscriptRef = useRef("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    const saved = localStorage.getItem("upstream-voice-output");
    if (saved !== null) setVoiceOutputEnabled(saved === "true");
  }, []);

  // Voice list loads async in most browsers (empty on first call) — this fires
  // again once they're actually ready. Quality is entirely OS/browser-dependent:
  // Edge exposes free neural "Natural"/"Online" voices that sound dramatically
  // better than the default robotic ones Chrome/Firefox fall back to on Windows.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function loadVoices() {
      const available = window.speechSynthesis.getVoices();
      if (available.length === 0) return;
      setVoices(available);

      const saved = localStorage.getItem("upstream-voice-uri");
      if (saved && available.some((v) => v.voiceURI === saved)) {
        setSelectedVoiceURI(saved);
        return;
      }

      const englishVoices = available.filter((v) => v.lang.startsWith("en"));
      const pool = englishVoices.length > 0 ? englishVoices : available;
      const scored = [...pool].sort((a, b) => voiceScore(b) - voiceScore(a));
      setSelectedVoiceURI(scored[0]?.voiceURI ?? null);
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  function voiceScore(voice: SpeechSynthesisVoice): number {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (name.includes("natural")) score += 3;
    if (name.includes("online")) score += 2;
    if (name.includes("neural")) score += 2;
    if (voice.localService === false) score += 1; // network voices tend to be higher quality
    return score;
  }

  function toggleVoiceOutput() {
    setVoiceOutputEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("upstream-voice-output", String(next));
      if (!next) {
        window.speechSynthesis?.cancel();
        audioRef.current?.pause();
      }
      return next;
    });
  }

  function handleVoiceChange(uri: string) {
    setSelectedVoiceURI(uri);
    localStorage.setItem("upstream-voice-uri", uri);
  }

  function speakWithBrowserVoice(text: string) {
    if (!speechSupported) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  /** Tries the real ElevenLabs voice first; silently falls back to the browser's
   *  built-in TTS if it's not configured (no key set) or the request fails. */
  async function speak(text: string) {
    if (!voiceOutputEnabled) return;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        });
        await audio.play();
        return;
      }
    } catch {
      // fall through to the browser voice below
    }

    speakWithBrowserVoice(text);
  }

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < Object.keys(event.results).length; i++) {
        transcript += event.results[i][0].transcript;
      }
      lastTranscriptRef.current = transcript;
      setInput(transcript);
    };
    // Press-to-talk, not press-to-fill-a-textbox: when speech ends, whatever
    // was transcribed gets sent immediately — "press the orb, say the thing,
    // hear the answer" with no separate manual send step.
    recognition.onend = () => {
      setListening(false);
      const finalTranscript = lastTranscriptRef.current.trim();
      lastTranscriptRef.current = "";
      if (finalTranscript) sendMessageRef.current(finalTranscript);
    };
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);
  }, []);

  function startListening() {
    const recognition = recognitionRef.current;
    if (!recognition || listening || busy) return;
    setInput("");
    lastTranscriptRef.current = "";
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  /** The orb's single entry point — open the panel if needed and start
   *  listening in one press, or stop an in-progress listen if pressed again. */
  function handleOrbPress() {
    if (!open) setOpen(true);
    if (listening) {
      stopListening();
    } else if (!busy) {
      startListening();
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: messages }),
      });
      if (!res.ok) throw new Error("Request failed");
      const { chatId } = (await res.json()) as { chatId: string };

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      let reply: string | null = null;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const pollRes = await fetch(`/api/assistant/${chatId}`);
        if (!pollRes.ok) continue;
        const data = (await pollRes.json()) as { status: string; reply: string | null };
        if (data.status !== "pending") {
          reply = data.reply ?? "…";
          break;
        }
      }

      const replyText =
        reply ??
        "No response yet — make sure your desktop widget is running and signed in, since that's what actually talks to Claude.";
      setMessages([...nextMessages, { role: "assistant", content: replyText }]);
      speak(replyText);
      router.refresh(); // in case a tool call changed session/project state
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Couldn't reach the assistant — check your connection and try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  // Keeps the speech-recognition callbacks (set up once below) calling the
  // latest sendMessage instead of a stale closure from the render they were
  // first attached in.
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const orbState: OrbState = listening ? "listening" : busy ? "thinking" : speaking ? "speaking" : "idle";

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-panel flex h-[500px] w-[340px] flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="font-manrope text-sm font-medium text-white">Karnezz</span>
              <div className="flex items-center gap-1">
                {speechSupported && (
                  <button
                    onClick={toggleVoiceOutput}
                    aria-label={voiceOutputEnabled ? "Mute voice replies" : "Unmute voice replies"}
                    className={`transition-colors ${voiceOutputEnabled ? "text-[#8b74ff]" : "text-neutral-500 hover:text-white"}`}
                  >
                    {voiceOutputEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close assistant" className="ml-1 text-neutral-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            {voiceSupported && (
              <div className="flex flex-col items-center gap-2 border-b border-white/10 py-5">
                <button
                  type="button"
                  onClick={handleOrbPress}
                  disabled={busy}
                  aria-label={listening ? "Stop talking to Karnezz" : "Talk to Karnezz"}
                  className="rounded-full transition-transform hover:scale-105 active:scale-95 disabled:cursor-default"
                >
                  <KarnezzOrb size={72} state={orbState} />
                </button>
                <span className="font-inter text-[11px] text-neutral-500">
                  {orbState === "listening"
                    ? "Listening…"
                    : orbState === "thinking"
                      ? "Thinking…"
                      : orbState === "speaking"
                        ? "Speaking…"
                        : "Tap to talk"}
                </span>
              </div>
            )}

            {speechSupported && voiceOutputEnabled && voices.length > 1 && (
              <div className="border-b border-white/10 px-4 py-1.5">
                <select
                  value={selectedVoiceURI ?? ""}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  aria-label="Voice"
                  className="w-full bg-transparent font-inter text-[10px] text-neutral-500 outline-none"
                >
                  {voices
                    .filter((v) => v.lang.startsWith("en"))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0b0c10] text-white">
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <p className="font-inter text-xs text-neutral-500">
                  Tap the orb and just talk — "what's my streak", "what's Cursor doing right now", "start a 25
                  minute session". Or type below.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 font-inter text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-[#6744FF] text-white"
                      : "bg-white/5 text-neutral-200"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
              {voiceSupported && (
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  disabled={busy}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                    listening
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : "bg-white/[0.03] text-neutral-400 hover:text-white"
                  }`}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask something…"}
                disabled={busy}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 font-inter text-sm text-white outline-none focus:border-[#6744FF] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6744FF] text-white transition-colors hover:bg-[#5a39f0] disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleOrbPress}
          aria-label="Talk to Karnezz"
          className="rounded-full"
        >
          <KarnezzOrb size={56} state={orbState} />
        </motion.button>
      )}
    </div>
  );
}
