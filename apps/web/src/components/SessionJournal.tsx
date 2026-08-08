"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SESSION_TAGS, type SessionTag } from "@focus-forge/core";

/**
 * Shown after a session completes — lets the user jot down what they built
 * and tag the session by type of work. Turns a timer log into a work journal.
 */
export function SessionJournal({
  sessionId,
  onSave,
}: {
  sessionId: string;
  onSave: (notes: string, tags: SessionTag[]) => void;
}) {
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<SessionTag[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: SessionTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!notes.trim() && selectedTags.length === 0) {
      onSave("", []);
      return;
    }
    setSaving(true);
    try {
      // Save directly to Supabase (client-side, RLS ensures ownership)
      const { getBrowserSupabaseClient } = await import("@/lib/supabase/browser");
      const supabase = getBrowserSupabaseClient();
      await supabase
        .from("focus_sessions")
        .update({ notes: notes.trim() || null, tags: selectedTags.length > 0 ? selectedTags : null })
        .eq("id", sessionId);
      onSave(notes.trim(), selectedTags);
    } catch {
      // Save failed — don't block the user, just skip
      onSave(notes.trim(), selectedTags);
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    onSave("", []);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6"
    >
      <div>
        <h3 className="font-manrope text-sm font-medium text-white">What did you build?</h3>
        <p className="mt-0.5 font-inter text-xs text-[#A1A1AA]">
          Quick note — turns your sessions into a searchable work journal.
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Fixed the auth redirect bug in the login flow…"
        rows={2}
        maxLength={300}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-inter text-sm text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-[#3B82F6]/50"
        autoFocus
      />

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <span className="font-inter text-[11px] text-neutral-500">Tag your work</span>
        <div className="flex flex-wrap gap-1.5">
          {SESSION_TAGS.map((tag) => {
            const active = selectedTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-inter text-[11px] transition-all ${
                  active
                    ? "border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#93C5FD] border"
                    : "border border-white/10 bg-white/[0.02] text-neutral-500 hover:border-white/20 hover:text-neutral-400"
                }`}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#3B82F6] px-5 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save note"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-xl border border-white/10 px-4 py-2.5 font-manrope text-sm text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-300"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
