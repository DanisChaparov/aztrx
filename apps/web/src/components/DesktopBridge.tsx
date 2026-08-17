"use client";

import { useEffect } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Forwards the signed-in Supabase session to the Electron main process via IPC.
 *
 * The main process uses fileStorageAdapter for auth — a local JSON file that is
 * completely separate from the renderer's cookies/localStorage. Without this
 * bridge, signing in inside the Electron window only sets cookies; the
 * background services (ambientMonitor, chatRunner, TTS, idleNudge) running in
 * the main process remain unauthenticated and silently drop all their data.
 *
 * The `?desktop=1` OAuth flow already handles this via the aztrx:// protocol
 * redirect, but a direct sign-in inside the Electron window does not. This
 * component catches both cases.
 */
export function DesktopBridge() {
  useEffect(() => {
    const aztrx = (window as any).aztrx;
    if (!aztrx?.isDesktop) return;

    async function sendSession() {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      aztrx.setSession(session.access_token, session.refresh_token).catch(
        (err: unknown) => console.error("[DesktopBridge] Failed to set session:", err)
      );
    }

    // Push immediately on mount (covers page-load after redirect).
    sendSession();

    // Push on every auth state change (sign-in, sign-out, token refresh).
    const supabase = getBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => sendSession());
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
