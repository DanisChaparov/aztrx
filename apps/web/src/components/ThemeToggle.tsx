"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "dark" | "light" | "auto";

const STORAGE_KEY = "upstream-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function ThemeToggle({ initialTheme }: { initialTheme?: string | null }) {
  const [theme, setTheme] = useState<Theme>(
    (initialTheme as Theme) || "dark"
  );

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored !== "dark" || initialTheme) {
      setTheme(initialTheme ? (initialTheme as Theme) : stored);
    }
    applyTheme(initialTheme ? (initialTheme as Theme) : stored);
  }, [initialTheme]);

  function handleChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "auto", label: "Auto", icon: Monitor },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleChange(value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-manrope text-xs font-medium transition-all ${
            theme === value
              ? "bg-[#3B82F6] text-white shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
