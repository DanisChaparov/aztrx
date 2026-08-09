"use client";

import { useState } from "react";
import { Edit, Check } from "lucide-react";

/**
 * Inline-editable bio textarea. Saves to profiles.bio on blur.
 * Gracefully handles the column not existing yet by catching errors.
 */
export function EditableBio({
  initialBio,
  onSave,
}: {
  initialBio: string | null;
  onSave: (bio: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || "");
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    setEditing(false);
    const trimmed = bio.trim();
    if (trimmed === (initialBio || "")) return; // no change
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch {
      setBio(initialBio || ""); // revert on error
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2 group">
        <p className="font-inter text-sm text-[#A1A1AA] leading-relaxed flex-1">
          {initialBio || "Add a bio — tell people what you work on, what languages you love, what you're building."}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 mt-0.5 rounded-lg p-1 text-neutral-600 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
          title="Edit bio"
        >
          <Edit size={13} />
        </button>
      </div>
    );
  }

  const charsLeft = 200 - bio.length;
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={bio}
        onChange={(e) => {
          if (e.target.value.length <= 200) setBio(e.target.value);
        }}
        onBlur={handleBlur}
        autoFocus
        rows={3}
        placeholder="Full-stack dev obsessed with Rust and systems programming…"
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6] placeholder:text-neutral-500"
      />
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[11px] ${charsLeft <= 20 ? "text-amber-400" : "text-neutral-500"}`}>
          {charsLeft} chars left
        </span>
        {saving && (
          <span className="flex items-center gap-1 font-inter text-[11px] text-[#60A5FA]">
            <Check size={11} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
