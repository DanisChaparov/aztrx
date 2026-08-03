"use client";

import { Github, Chrome, Facebook, Twitter } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { WaterButton } from "@/components/WaterButton";

interface ProviderConfig {
  provider: Provider;
  label: string;
  icon: typeof Github;
  bgClass: string;
  textClass: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  github: {
    provider: "github",
    label: "Sign in with GitHub",
    icon: Github,
    bgClass: "bg-[#24292e] hover:bg-[#1b1f23]",
    textClass: "text-white",
  },
  google: {
    provider: "google",
    label: "Sign in with Google",
    icon: Chrome,
    bgClass: "bg-white hover:bg-gray-100",
    textClass: "text-gray-800",
  },
  facebook: {
    provider: "facebook",
    label: "Sign in with Facebook",
    icon: Facebook,
    bgClass: "bg-[#1877F2] hover:bg-[#166fe5]",
    textClass: "text-white",
  },
  twitter: {
    provider: "twitter",
    label: "Sign in with X",
    icon: Twitter,
    bgClass: "bg-black hover:bg-[#111] border border-white/20",
    textClass: "text-white",
  },
};

export function SocialSignInButton({
  provider,
  desktop = false,
}: {
  provider: keyof typeof PROVIDERS;
  desktop?: boolean;
}) {
  const config = PROVIDERS[provider];

  async function handleSignIn() {
    const supabase = getBrowserSupabaseClient();
    const isGithub = provider === "github";
    await supabase.auth.signInWithOAuth({
      provider: config.provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${desktop ? "?desktop=1" : ""}`,
        // GitHub: read:user only. Other providers use their default scopes.
        ...(isGithub ? { scopes: "read:user" } : {}),
      },
    });
  }

  // GitHub uses the existing WaterButton style; other providers use native brand styling
  if (provider === "github") {
    return (
      <WaterButton onClick={handleSignIn} variant="primary" className="w-full">
        <Github size={18} />
        {config.label}
      </WaterButton>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 font-manrope text-sm font-semibold transition-all ${config.bgClass} ${config.textClass}`}
    >
      <config.icon size={18} />
      {config.label}
    </button>
  );
}
