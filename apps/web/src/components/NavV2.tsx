"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FolderKanban, Timer, Crown, Settings, User, Monitor, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/session", label: "Focus", icon: Timer },
  { href: "/screen-time", label: "Screen Time", icon: Monitor },
  { href: "/plans", label: "Plans", icon: Crown },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavV2() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-30 px-4 pt-3 sm:px-6">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-white/[0.06] bg-black/60 px-4 py-2 backdrop-blur-xl"
        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="font-jakarta text-[14px] font-bold tracking-tight text-white">Upstream</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-jakarta text-[12px] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-v2-active"
                    className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.06]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon size={13} />
                  <span className="hidden sm:inline">{link.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-jakarta text-[12px] text-zinc-500 transition-all duration-200 hover:text-zinc-300 hover:bg-white/[0.04]"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </nav>
    </div>
  );
}
