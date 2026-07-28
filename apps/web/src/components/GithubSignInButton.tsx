"use client";

import { Github } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { WaterButton } from "@/components/WaterButton";

export function GithubSignInButton({ desktop = false }: { desktop?: boolean }) {
  async function handleSignIn() {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${desktop ? "?desktop=1" : ""}`,
        // repo (private+public commit reads) + read:user (username for the commit-author check)
        scopes: "repo read:user",
      },
    });
  }

  return (
    <WaterButton onClick={handleSignIn} variant="primary" className="w-full">
      <Github size={18} />
      Continue with GitHub
    </WaterButton>
  );
}
