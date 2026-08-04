"use client";

import { useEffect, useState } from "react";

/**
 * Applies the v2 dark theme body class when the v2 theme cookie is set.
 * Wraps all children so the v2 design applies to every page — landing, login,
 * signup, and authenticated pages.
 */
export function ThemeBody({ children }: { children: React.ReactNode }) {
  const [isV2, setIsV2] = useState(false);

  useEffect(() => {
    const v2 = document.cookie.includes("upstream-theme=v2");
    setIsV2(v2);
  }, []);

  return (
    <div className={isV2 ? "theme-v2" : "theme-v1"}>
      {children}
    </div>
  );
}
