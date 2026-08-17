"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Aztrx AI — your personal developer assistant.
 *
 * Two backends: direct Anthropic API (works instantly, no setup) and
 * desktop Claude CLI (full power with 11 MCP tools and computer awareness).
 * If neither is available, shows a helpful setup message.
 */
export function AssistantPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

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
      const json = (await res.json()) as { chatId: string; reply?: string; mode?: string };

      // Direct response — no polling needed.
      if (json.mode === "user-key" || json.mode === "offline" || json.mode === "error") {
        setMessages([...nextMessages, { role: "assistant", content: json.reply ?? "…" }]);
        setBusy(false);
        router.refresh();
        return;
      }

      // Desktop mode — poll for the response.
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      let reply: string | null = null;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const pollRes = await fetch(`/api/assistant/${json.chatId}`);
        if (!pollRes.ok) continue;
        const data = (await pollRes.json()) as { status: string; reply: string | null };
        if (data.status !== "pending") {
          reply = data.reply ?? "…";
          break;
        }
      }

      const replyText = reply ?? "The desktop app didn't respond in time. Add an Anthropic API key in Settings for instant responses without the desktop app.";
      setMessages([...nextMessages, { role: "assistant", content: replyText }]);
      router.refresh();
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Couldn't reach Aztrx AI. Check your connection, or add an Anthropic API key in Settings → API Key for instant responses." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-panel flex h-[460px] w-[340px] flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#60A5FA]" />
                <span className="font-manrope text-sm font-medium text-white">Aztrx AI</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-inter text-xs text-neutral-500">
                    Ask me anything about your coding stats, sessions, or projects.
                  </p>

                  {/* API key prompt */}
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
                    <p className="font-manrope text-xs font-medium text-amber-400 mb-1">
                      Enable unlimited AI
                    </p>
                    <p className="font-inter text-[11px] leading-relaxed text-neutral-400 mb-2">
                      Add your own OpenAI, Anthropic, or Gemini key for unlimited questions. Stored in your browser only — we never see it.
                      Or use the desktop app for free unlimited AI via Claude Code.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.href = "/settings"}
                      className="rounded-lg bg-[#3B82F6] px-3 py-1.5 font-manrope text-[11px] font-semibold text-white"
                    >
                      Add API key in Settings →
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {[
                      "What's my streak?",
                      "How was my productivity this week?",
                      "Which project should I focus on?",
                      "Start a 25-minute session",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        disabled={busy}
                        className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left font-inter text-xs text-[#A1A1AA] transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 font-inter text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-[#3B82F6] text-white"
                      : "bg-white/5 text-neutral-200"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span className="font-inter text-[11px] text-neutral-500">Aztrx AI is thinking…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aztrx AI anything…"
                disabled={busy}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white transition-colors hover:bg-[#2563EB] disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher orb */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(true)}
          aria-label="Open Aztrx AI"
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, #60A5FA55, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #60A5FA, #2563EB)",
              boxShadow: "0 0 20px #60A5FA88",
            }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
        </motion.button>
      )}
    </div>
  );
}
