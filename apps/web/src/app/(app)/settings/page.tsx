import { getProfile } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await getServerSupabaseClient();
  const profile = await getProfile(supabase);

  return (
    <div className="flex flex-col gap-8 pt-8">
      <h1 className="font-instrument-serif text-3xl text-white">Settings</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}
