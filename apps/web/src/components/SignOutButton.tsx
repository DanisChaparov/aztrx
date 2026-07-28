"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-manrope text-[13px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
      aria-label="Sign out"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
