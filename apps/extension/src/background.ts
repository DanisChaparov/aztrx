import {
  abandonSession,
  getActiveSession,
  listSessions,
  logDistraction,
  startSession,
  verifySession,
} from "@focus-forge/api-client";
import { calculateStreak, type FocusSession } from "@focus-forge/core";
import { getBlocklist } from "./blocklist";
import { createExtensionSupabaseClient } from "./supabaseClient";

const supabase = createExtensionSupabaseClient();

const ACTIVE_SESSION_KEY = "upstream_active_session";

async function getCachedActiveSession(): Promise<FocusSession | null> {
  const result = await chrome.storage.local.get(ACTIVE_SESSION_KEY);
  return result[ACTIVE_SESSION_KEY] ?? null;
}

async function setCachedActiveSession(session: FocusSession | null): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_SESSION_KEY]: session });
}

async function refreshBlockingRules(): Promise<void> {
  const session = await getCachedActiveSession();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existing.map((r) => r.id);
  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existingIds });
  }

  if (!session) return;

  const blocklist = await getBlocklist();
  const rules: chrome.declarativeNetRequest.Rule[] = blocklist.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { extensionPath: `/blocked.html?from=${encodeURIComponent(domain)}` },
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
}

/** Pulls the authoritative session state from Supabase (source of truth across web/extension/desktop). */
async function syncFromServer(): Promise<FocusSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    await setCachedActiveSession(null);
    await refreshBlockingRules();
    return null;
  }

  const active = await getActiveSession(supabase);
  await setCachedActiveSession(active);
  await refreshBlockingRules();
  return active;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("focusforge-sync", { periodInMinutes: 0.5 });
  syncFromServer();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "focusforge-sync") syncFromServer();
});

// Web app -> extension: hands off the signed-in session so the extension
// doesn't need its own separate OAuth flow. See apps/web ExtensionBridge.
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "UPSTREAM_SET_SESSION") {
      const { error } = await supabase.auth.setSession({
        access_token: message.accessToken,
        refresh_token: message.refreshToken,
      });
      if (!error) await syncFromServer();
      sendResponse({ ok: !error });
    }
  })();
  return true; // keep the message channel open for the async response
});

// Popup <-> background messaging.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "GET_STATE": {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const session = await getCachedActiveSession();
        const recentSessions = user ? await listSessions(supabase, { limit: 30 }) : [];
        sendResponse({ signedIn: !!user, session, streak: calculateStreak(recentSessions) });
        break;
      }
      case "START_SESSION": {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return sendResponse({ error: "Not signed in" });
        const session = await startSession(supabase, {
          userId: user.id,
          projectId: message.projectId ?? null,
          plannedDurationMin: message.plannedDurationMin,
        });
        await setCachedActiveSession(session);
        await refreshBlockingRules();
        sendResponse({ session });
        break;
      }
      case "COMPLETE_SESSION": {
        const result = await verifySession(supabase, message.sessionId);
        await setCachedActiveSession(null);
        await refreshBlockingRules();
        sendResponse({ result });
        break;
      }
      case "ABANDON_SESSION": {
        await abandonSession(supabase, message.sessionId);
        await setCachedActiveSession(null);
        await refreshBlockingRules();
        sendResponse({ ok: true });
        break;
      }
      case "DISTRACTION_BLOCKED": {
        const session = await getCachedActiveSession();
        if (session) {
          await logDistraction(supabase, { sessionId: session.id, source: "extension", domainOrApp: message.domain });
        }
        sendResponse({ ok: true });
        break;
      }
    }
  })();
  return true;
});
