import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Maps Supabase OAuth provider names and user metadata into a profiles row.
 * Handles GitHub, Google, Facebook, Twitter/X, and email/password sign-ups.
 */
function extractProviderInfo(user: {
  id: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  // The provider the user signed in with this time.
  const provider = (meta.provider ?? user.app_metadata?.provider ?? "email") as string;

  const result: Record<string, unknown> = {
    id: user.id,
    auth_provider: provider,
    avatar_url: (meta.avatar_url as string) ?? null,
  };

  // OAuth metadata may carry a human-readable name. Capture it here so it can
  // be used as the initial display_name when the profile row doesn't exist yet.
  // The caller decides whether to include it in the upsert — it only applies to
  // brand-new profiles so it never overwrites a name the user set via onboarding.
  const oauthFullName = (meta.full_name as string) ?? (meta.name as string) ?? null;

  // GitHub — capture the username + access token for GitHub API calls.
  if (provider === "github") {
    result.github_username = (meta.user_name as string) ?? null;
    if (oauthFullName) result._oauth_display_name = oauthFullName;
  }
  // Google / Facebook / Twitter — extract display name and avatar.
  if (provider === "google" || provider === "facebook" || provider === "twitter") {
    if (!result.avatar_url) {
      result.avatar_url = (meta.picture as string) ?? (meta.avatar_url as string) ?? null;
    }
    if (oauthFullName) result._oauth_display_name = oauthFullName;
  }

  return result;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const isDesktop = request.nextUrl.searchParams.get("desktop") === "1";
  // Where to send the user after the OAuth dance finishes. Passed through from
  // whoever started the flow (e.g. ?returnTo=/projects from the private-repo-
  // access button) so the user lands back where they were, not always on the
  // dashboard wondering whether anything actually changed.
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard";

  if (code) {
    const supabase = await getServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const profileData = extractProviderInfo(data.user);

      // If a provider_token (GitHub access token) is present, store it.
      // On a scope-upgrade re-auth (e.g. GrantPrivateRepoAccessButton sends
      // someone back through GitHub OAuth with "read:user repo" after they
      // already signed in with just "read:user"), Supabase may or may not
      // include a fresh provider_token — the old token is still valid, just
      // narrower. If it IS here it is strictly better (broader scope), so
      // overwrite. If it is not here the existing token stays as-is.
      if (data.session?.provider_token && profileData.auth_provider === "github") {
        profileData.github_access_token = data.session.provider_token;
      }

      // Populate display_name from OAuth metadata ONLY for brand-new profiles.
      // If the row already exists the user may have set a custom name via
      // onboarding — never overwrite it.
      const oauthDisplayName = profileData._oauth_display_name as string | undefined;
      delete profileData._oauth_display_name;

      if (oauthDisplayName) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existing) {
          (profileData as Record<string, unknown>).display_name = oauthDisplayName;
        }
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(profileData as any, { onConflict: "id" });

      if (upsertError) {
        console.error("Failed to upsert profile after auth callback:", upsertError);
      }
    }

    // Desktop widget pairing: hand the session off via a custom protocol
    // instead of landing in the browser dashboard. Requires the desktop app
    // to have registered the aztrx:// handler (i.e. been run at least once).
    if (isDesktop && !error && data.session) {
      const params = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      return NextResponse.redirect(`aztrx://auth?${params.toString()}`);
    }
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
