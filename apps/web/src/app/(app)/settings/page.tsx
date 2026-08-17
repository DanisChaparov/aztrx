import { getProfile } from "@aztrx/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await getServerSupabaseClient();
  const profile = await getProfile(supabase);

  // Fetch additional profile fields (may not exist yet if migrations haven't been applied)
  let themePreference: string | null = null;
  let website: string | null = null;
  let twitterHandle: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: row } = await supabase
        .from("profiles")
        .select("theme_preference, website, twitter")
        .eq("id", user.id)
        .single();
      const r = row as Record<string, unknown> | null;
      themePreference = (r?.theme_preference as string) ?? null;
      website = (r?.website as string) ?? null;
      twitterHandle = (r?.twitter as string) ?? null;
    }
  } catch {
    // Columns missing — not fatal.
  }

  return (
    <div className="flex flex-col gap-8 pt-8">
      <h1 className="font-instrument-serif text-3xl text-white">Settings</h1>
      <SettingsForm profile={{ ...profile, themePreference, website, twitter: twitterHandle }} />
    </div>
  );
}
