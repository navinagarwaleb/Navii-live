"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BIO } from "@/lib/performer-defaults";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import {
  normalizeFacebookUrl,
  normalizeInstagramHandle,
} from "@/lib/social";
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
  const [instagram, setInstagram] = useState(
    performer.instagram_handle
      ? performer.instagram_handle.startsWith("@")
        ? performer.instagram_handle
        : `@${performer.instagram_handle}`
      : "",
  );
  const [facebook, setFacebook] = useState(performer.facebook_url ?? "");
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
    const nextIg = normalizeInstagramHandle(instagram);
    const nextFb = normalizeFacebookUrl(facebook);

    const { data, error: saveError } = await supabase
      .from("performers")
      .update({
        display_name: displayName.trim(),
        bio: nextBio,
        instagram_handle: nextIg,
        facebook_url: nextFb,
      })
      .eq("id", performer.id)
      .select(PERFORMER_SELECT_SAFE)
      .single();

    if (saveError) {
      setError(
        /instagram_handle|facebook_url|column .* does not exist|Could not find/i.test(
          saveError.message ?? "",
        )
          ? "Social link columns are missing in Supabase. Run migration 20260913_performers_social_links.sql, then try again."
          : saveError.message,
      );
    } else {
      setBio(nextBio);
      setInstagram(nextIg ? `@${nextIg}` : "");
      setFacebook(nextFb ?? "");
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

      <div>
        <h2 className="font-serif text-xl font-semibold text-[#FAFAF9]">
          Social links
        </h2>
        <p className="mt-1 text-sm text-[#A8A29E]">
          Shown as icons on your tip section when filled in.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#292524] p-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="profile-instagram"
            className="mb-2 block text-sm font-medium text-[#A8A29E]"
          >
            Instagram
          </label>
          <Input
            id="profile-instagram"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
            className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
            placeholder="@yourname"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="profile-facebook"
            className="mb-2 block text-sm font-medium text-[#A8A29E]"
          >
            Facebook
          </label>
          <Input
            id="profile-facebook"
            value={facebook}
            onChange={(event) => setFacebook(event.target.value)}
            className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
            placeholder="https://facebook.com/yourpage"
            inputMode="url"
            autoComplete="off"
          />
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
