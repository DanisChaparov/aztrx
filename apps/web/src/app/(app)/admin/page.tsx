import { getServerSupabaseClient } from "@/lib/supabase/server";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif text-3xl text-white">Admin</h1>
        <span className="font-mono text-xs text-neutral-500">Signed in as {user.user?.email ?? "?"}</span>
      </div>
      <AdminPanel userId={user.user?.id ?? ""} />
    </div>
  );
}
