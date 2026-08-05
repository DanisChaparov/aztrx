/**
 * Client-side AI provider calls. Keys live in localStorage, never touch
 * the server. Direct browser-to-provider requests. Zero-knowledge by design.
 *
 * localStorage keys:
 *   upstream:anthropic-key  — Anthropic (Claude) API key
 *   upstream:openai-key     — OpenAI (ChatGPT) API key
 *   upstream:gemini-key     — Google Gemini API key
 */

const LS_ANTHROPIC = "upstream:anthropic-key";
const LS_OPENAI = "upstream:openai-key";
const LS_GEMINI = "upstream:gemini-key";

export type AiProvider = "anthropic" | "openai" | "gemini";

export function getSavedKey(provider: AiProvider): string | null {
  if (typeof window === "undefined") return null;
  const keys: Record<AiProvider, string> = {
    anthropic: LS_ANTHROPIC,
    openai: LS_OPENAI,
    gemini: LS_GEMINI,
  };
  return localStorage.getItem(keys[provider]);
}

export function saveKey(provider: AiProvider, key: string): void {
  if (typeof window === "undefined") return;
  const keys: Record<AiProvider, string> = {
    anthropic: LS_ANTHROPIC,
    openai: LS_OPENAI,
    gemini: LS_GEMINI,
  };
  localStorage.setItem(keys[provider], key);
}

export function deleteKey(provider: AiProvider): void {
  if (typeof window === "undefined") return;
  const keys: Record<AiProvider, string> = {
    anthropic: LS_ANTHROPIC,
    openai: LS_OPENAI,
    gemini: LS_GEMINI,
  };
  localStorage.removeItem(keys[provider]);
}

export function getAnySavedKey(): { provider: AiProvider; key: string } | null {
  for (const provider of ["anthropic", "openai", "gemini"] as AiProvider[]) {
    const key = getSavedKey(provider);
    if (key) return { provider, key };
  }
  return null;
}

interface AiCallOptions {
  provider: AiProvider;
  key: string;
  model?: string;
  systemPrompt?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
};

/**
 * Call an AI provider directly from the browser. Keys never leave the user's
 * machine. Works with CORS — Anthropic and OpenAI support direct browser access
 * with the right headers.
 */
export async function callAiProvider(opts: AiCallOptions): Promise<string> {
  switch (opts.provider) {
    case "anthropic":
      return callAnthropic(opts);
    case "openai":
      return callOpenAI(opts);
    case "gemini":
      return callGemini(opts);
  }
}

async function callAnthropic(opts: AiCallOptions): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.key,
      "anthropic-version": "2023-06-01",
      // Required by Anthropic for direct browser access
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODELS.anthropic,
      max_tokens: 1024,
      system: opts.systemPrompt || undefined,
      messages: opts.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Anthropic returned ${res.status}`);
  }

  const data = await res.json();
  return (data as any).content?.[0]?.text || "";
}

async function callOpenAI(opts: AiCallOptions): Promise<string> {
  const messages: any[] = [];
  if (opts.systemPrompt) {
    messages.push({ role: "system", content: opts.systemPrompt });
  }
  messages.push(...opts.messages.map((m) => ({ role: m.role, content: m.content })));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.key}`,
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODELS.openai,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `OpenAI returned ${res.status}`);
  }

  const data = await res.json();
  return (data as any).choices?.[0]?.message?.content || "";
}

async function callGemini(opts: AiCallOptions): Promise<string> {
  const model = opts.model || DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.key}`;

  // Build a single prompt from system + messages
  const parts: string[] = [];
  if (opts.systemPrompt) parts.push(opts.systemPrompt);
  parts.push(...opts.messages.map((m) => `${m.role}: ${m.content}`));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: parts.join("\n\n") }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Gemini returned ${res.status}`);
  }

  const data = await res.json();
  return (data as any).candidates?.[0]?.content?.parts?.[0]?.text || "";
}
