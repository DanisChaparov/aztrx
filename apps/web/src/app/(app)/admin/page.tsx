import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif text-3xl text-white">Admin</h1>
        <span className="font-mono text-xs text-neutral-500">Signed in as {user.email ?? "?"}</span>
      </div>
      <AdminPanel userId={user.id} />
    </div>
  );
}
