"use client";

import { useEffect, useState } from "react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

export function WelcomeGreeting({ name, streak }: { name: string; streak: number }) {
  const [g, setG] = useState(greeting());
  const [displayName, setDisplayName] = useState(name);

  useEffect(() => {
    // localStorage takes priority — it's what the user actually typed.
    const local = localStorage.getItem("upstream-display-name");
    if (local) setDisplayName(local);
    else if (name && name !== "developer") setDisplayName(name);
  }, [name]);

  // Re-check greeting every minute so it flips at hour boundaries.
  useEffect(() => {
    const id = setInterval(() => setG(greeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="font-instrument-serif text-3xl text-white">
        {g}, <span className="text-[#8b74ff]">{displayName}</span>
      </h1>
      {streak > 0 ? (
        <p className="font-inter text-sm text-[#A1A1AA]">
          {streak}-day streak. {g === "Good morning" ? "Ready to ship something today?" : "How's the work going?"}
        </p>
      ) : (
        <p className="font-inter text-sm text-[#A1A1AA]">
          Start a session to begin your streak.
        </p>
      )}
    </div>
  );
}
