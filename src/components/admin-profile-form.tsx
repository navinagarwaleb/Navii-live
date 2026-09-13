"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BIO } from "@/lib/performer-defaults";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer } from "@/lib/types";

export function AdminProfileForm({
  performer,
  onSaved,
}: {
  performer: Performer;
  onSaved?: (next: Performer) => void;
}) {
  const [displayName, setDisplayName] = useState(performer.display_name ?? "");
  const [bio, setBio] = useState(performer.bio?.trim() || DEFAULT_BIO);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setSaving(false);
      return;
    }

    const nextBio = bio.trim() || DEFAULT_BIO;

    const { data, error: saveError } = await supabase
      .from("performers")
      .update({
        display_name: displayName.trim(),
        bio: nextBio,
      })
      .eq("id", performer.id)
      .select(PERFORMER_SELECT_SAFE)
      .single();

    if (saveError) {
      setError(saveError.message);
    } else {
      setBio(nextBio);
      setMessage("Profile saved.");
      if (data && onSaved) onSaved(data as Performer);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={(event) => void onSave(event)} className="grid gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-[#FAFAF9]">
          Profile settings
        </h1>
        <p className="mt-2 text-sm text-[#A8A29E]">
          How you appear on your public page.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#292524] p-5">
        <div>
          <label
            htmlFor="profile-display-name"
            className="mb-2 block text-sm font-medium text-[#A8A29E]"
          >
            Display name
          </label>
          <Input
            id="profile-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
            required
          />
        </div>
        <div>
          <label
            htmlFor="profile-bio"
            className="mb-2 block text-sm font-medium text-[#A8A29E]"
          >
            Bio / tagline
          </label>
          <Input
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
          />
          <p className="mt-2 text-xs text-[#A8A29E]">
            Shown under your name on /{performer.username}
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="min-h-[48px] w-full bg-[#FAFAF9] text-[#1C1917] hover:bg-white"
        disabled={saving}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
        Save profile
      </Button>
    </form>
  );
}
