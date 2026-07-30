"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FolderKanban, Timer } from "lucide-react";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/session", label: "Focus", icon: Timer },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <nav className="liquid-glass mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={20} />
          <span className="font-jakarta text-[15px] font-extrabold tracking-tight text-white">Upstream</span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="relative px-3 py-1.5">
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-[#5ed29c]/15"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span
                  className={`relative flex items-center gap-1.5 font-manrope text-[13px] font-medium transition-colors ${
                    isActive ? "text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{link.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <SignOutButton />
      </nav>
    </div>
  );
}
