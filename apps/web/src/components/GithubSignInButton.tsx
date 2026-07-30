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
        // read:user only. Commits on public repos are readable with any
        // authenticated token, so signing in needs no repository access at all —
        // the `repo` scope is requested separately, and only by someone who
        // actually links a private repo (see GrantPrivateRepoAccessButton).
        scopes: "read:user",
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
