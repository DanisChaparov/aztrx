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
  // Start with empty greeting during SSR to avoid hydration mismatch.
  // The real greeting is set client-side in useEffect.
  const [g, setG] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setG(greeting());
    // localStorage takes priority — it's what the user actually typed.
    const local = localStorage.getItem("aztrx-display-name");
    if (local) setDisplayName(local);
    else if (name && name !== "developer") setDisplayName(name);
    else setDisplayName(name || "developer");
  }, [name]);

  // Re-check greeting every minute so it flips at hour boundaries.
  useEffect(() => {
    const id = setInterval(() => setG(greeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  // During SSR, render a static placeholder that matches the client's
  // initial empty-string state.
  if (!g) {
    return (
      <div className="flex flex-col gap-0.5">
        <h1 className="font-instrument-serif text-3xl text-white">
          Welcome, <span className="text-[#60A5FA]">{name || "developer"}</span>
        </h1>
        <p className="font-inter text-sm text-[#A1A1AA]">
          {streak > 0 ? `${streak}-day streak.` : "Start a session to begin your streak."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="font-instrument-serif text-3xl text-white">
        {g}, <span className="text-[#60A5FA]">{displayName}</span>
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
