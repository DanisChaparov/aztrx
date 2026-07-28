import { NextResponse, type NextRequest } from "next/server";
import { upsertGithubProfile } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const isDesktop = request.nextUrl.searchParams.get("desktop") === "1";

  if (code) {
    const supabase = await getServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // provider_token (the GitHub access token) is only available on this
    // initial exchange, so capture it now for the verify-session function.
    if (!error && data.session?.provider_token && data.user) {
      await upsertGithubProfile(supabase, {
        userId: data.user.id,
        githubAccessToken: data.session.provider_token,
        githubUsername: (data.user.user_metadata?.user_name as string | undefined) ?? null,
      });
    }

    // Desktop widget pairing: hand the session off via a custom protocol
    // instead of landing in the browser dashboard. Requires the desktop app
    // to have registered the upstream:// handler (i.e. been run at least once).
    if (isDesktop && !error && data.session) {
      const params = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      return NextResponse.redirect(`upstream://auth?${params.toString()}`);
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
