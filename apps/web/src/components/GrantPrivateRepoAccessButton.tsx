"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Opt-in upgrade to the `repo` OAuth scope.
 *
 * Signing in only asks for `read:user`, because public-repo commits need no
 * repository access at all. `repo` is the *only* GitHub OAuth scope that can
 * read a private repo, and it also grants write access to every repository the
 * user owns — so it is never requested up front, only by someone who has
 * decided they want private repos verified and can see exactly what they are
 * agreeing to.
 */
export function GrantPrivateRepoAccessButton() {
  const [pending, setPending] = useState(false);

  async function handleGrant() {
    setPending(true);
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        // Sends the user back to wherever they came from instead of dropping
        // them on the dashboard after the OAuth dance. The callback route
        // reads ?returnTo and redirects there on completion.
        redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(window.location.pathname)}`,
        scopes: "read:user repo",
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      <div className="flex items-center gap-2">
        <Lock size={15} className="text-[#60A5FA]" />
        <h3 className="font-manrope text-sm font-medium text-white">Verifying a private repo?</h3>
      </div>
      <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
        Public repos work already — Aztrx reads their commits without any access to your account. Private
        repos need GitHub&apos;s <code className="rounded bg-white/5 px-1 py-0.5 text-[12px]">repo</code> scope,
        which is broad: it also grants write access to every repository you own. GitHub offers no narrower
        option. Only grant it if that trade is worth it to you.
      </p>
      <button
        type="button"
        onClick={handleGrant}
        disabled={pending}
        className="self-start rounded-lg border border-white/10 bg-[#1c1d22] px-4 py-2 font-inter text-sm text-white transition-colors hover:bg-[#26272e] disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Grant private repo access"}
      </button>
    </div>
  );
}
