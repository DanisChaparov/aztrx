"use client";

import { useEffect } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Hands the signed-in Supabase session off to the Upstream browser
 * extension (if installed) so it doesn't need its own separate OAuth flow.
 * Requires NEXT_PUBLIC_EXTENSION_ID and the extension's manifest to list this
 * origin under "externally_connectable". No-ops silently if either is missing
 * or the extension isn't installed — this is a nice-to-have, not a hard dep.
 */
export function ExtensionBridge() {
  useEffect(() => {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    if (!extensionId) return;

    const chromeRuntime = (window as any).chrome?.runtime;
    if (!chromeRuntime?.sendMessage) return;

    async function sendSession() {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      chromeRuntime.sendMessage(
        extensionId,
        {
          type: "UPSTREAM_SET_SESSION",
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        },
        () => {
          // Swallow "Could not establish connection" — extension not installed is a valid state.
          void chromeRuntime.lastError;
        }
      );
    }

    sendSession();
    const supabase = getBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => sendSession());
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
