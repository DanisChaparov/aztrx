"use client";

import { useEffect } from "react";

/**
 * Activates the v2 theme when ?theme=v2 is in the URL.
 * Sets a cookie so subsequent page loads use the v2 design.
 * ?theme=v1 switches back to the original design.
 */
export function ThemeActivator() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");
    if (theme === "v2") {
      document.cookie = "upstream-theme=v2; path=/; max-age=31536000";
      // Remove the param and reload so the v2 layout renders
      const url = new URL(window.location.href);
      url.searchParams.delete("theme");
      window.location.replace(url.toString());
    } else if (theme === "v1") {
      document.cookie = "upstream-theme=v1; path=/; max-age=31536000";
      const url = new URL(window.location.href);
      url.searchParams.delete("theme");
      window.location.replace(url.toString());
    }
  }, []);

  return null;
}
