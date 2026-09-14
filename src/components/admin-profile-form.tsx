"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronDown, Loader2, Music2 } from "lucide-react";
import { SongTagEditor } from "@/components/song-tag-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BIO } from "@/lib/performer-defaults";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import {
  normalizeFacebookUrl,
  normalizeInstagramHandle,
} from "@/lib/social";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  MAX_CUSTOM_TAGS,
  MAX_TAG_CHARS,
  normalizeCustomTags,
} from "@/lib/tags";
import type { Performer } from "@/lib/types";
import { cn } from "@/lib/utils";

function SettingsAccordion({
  title,
  summary,
  open,
  onToggle,
  children,
  id,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  id?: string;
}) {
  const panelId = useId();

  return (
    <div
      id={id}
      className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#292524]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
      >
        <span>
          <span className="block font-serif text-xl font-semibold text-[#FAFAF9]">
            {title}
          </span>
          <span className="mt-0.5 block text-sm text-[#A8A29E]">{summary}</span>
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-[#A8A29E] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div id={panelId} className="border-t border-white/10 px-5 pt-4 pb-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AdminProfileForm({
  performer,
  onSaved,
  initialOpenSection,
}: {
  performer: Performer;
  onSaved?: (next: Performer) => void;
  initialOpenSection?: "profile" | "social" | "tags" | null;
}) {
  const [openSection, setOpenSection] = useState<
    "profile" | "social" | "tags" | null
  >(initialOpenSection ?? null);

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
  const [customTags, setCustomTags] = useState(
    normalizeCustomTags(performer.custom_tags ?? []),
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [tagsStatus, setTagsStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [socialMessage, setSocialMessage] = useState("");
  const [socialError, setSocialError] = useState("");
  const [tagsError, setTagsError] = useState("");
  const tagsSaveTimer = useRef<number | null>(null);
  const tagsRequestId = useRef(0);

  useEffect(() => {
    if (initialOpenSection) setOpenSection(initialOpenSection);
  }, [initialOpenSection]);

  function toggle(section: "profile" | "social" | "tags") {
    setOpenSection((current) => (current === section ? null : section));
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setProfileError("Supabase is not configured.");
      setSavingProfile(false);
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
      setProfileError(saveError.message);
    } else {
      setBio(nextBio);
      setProfileMessage("Profile saved.");
      if (data && onSaved) onSaved(data as Performer);
    }
    setSavingProfile(false);
  }

  async function onSaveSocial(event: FormEvent) {
    event.preventDefault();
    setSavingSocial(true);
    setSocialError("");
    setSocialMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSocialError("Supabase is not configured.");
      setSavingSocial(false);
      return;
    }

    const nextIg = normalizeInstagramHandle(instagram);
    const nextFb = normalizeFacebookUrl(facebook);
    const { data, error: saveError } = await supabase
      .from("performers")
      .update({
        instagram_handle: nextIg,
        facebook_url: nextFb,
      })
      .eq("id", performer.id)
      .select(PERFORMER_SELECT_SAFE)
      .single();

    if (saveError) {
      setSocialError(
        /instagram_handle|facebook_url|column .* does not exist|Could not find/i.test(
          saveError.message ?? "",
        )
          ? "Social link columns are missing in Supabase. Run migration 20260913_performers_social_links.sql, then try again."
          : saveError.message,
      );
    } else {
      setInstagram(nextIg ? `@${nextIg}` : "");
      setFacebook(nextFb ?? "");
      setSocialMessage("Social links saved.");
      if (data && onSaved) onSaved(data as Performer);
    }
    setSavingSocial(false);
  }

  const persistTags = useCallback(
    async (nextTags: string[]) => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setTagsError("Supabase is not configured.");
        setTagsStatus("error");
        return;
      }

      const requestId = ++tagsRequestId.current;
      setTagsStatus("saving");
      setTagsError("");

      const normalized = normalizeCustomTags(nextTags);
      const { data, error: saveError } = await supabase
        .from("performers")
        .update({ custom_tags: normalized })
        .eq("id", performer.id)
        .select(PERFORMER_SELECT_SAFE)
        .single();

      if (requestId !== tagsRequestId.current) return;

      if (saveError) {
        setTagsError(
          /custom_tags|column .* does not exist|Could not find/i.test(
            saveError.message ?? "",
          )
            ? "Custom tags column is missing. Run migration 20260914_performers_custom_tags.sql, then try again."
            : saveError.message,
        );
        setTagsStatus("error");
        return;
      }

      setCustomTags(normalized);
      setTagsStatus("saved");
      if (data && onSaved) onSaved(data as Performer);
    },
    [onSaved, performer.id],
  );

  function onTagsChange(next: string[]) {
    setCustomTags(next);
    setTagsStatus("idle");
    if (tagsSaveTimer.current) window.clearTimeout(tagsSaveTimer.current);
    tagsSaveTimer.current = window.setTimeout(() => {
      void persistTags(next);
    }, 450);
  }

  useEffect(() => {
    return () => {
      if (tagsSaveTimer.current) window.clearTimeout(tagsSaveTimer.current);
    };
  }, []);

  const tagCount = customTags.length;

  return (
    <div className="grid gap-3">
      <div className="mb-3">
        <h1 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-[#FAFAF9]">
          Profile settings
        </h1>
        <p className="mt-2 text-sm text-[#A8A29E]">
          How you appear on your public page.
        </p>
      </div>

      <SettingsAccordion
        title="Profile"
        summary={
          openSection === "profile"
            ? "Display name and bio shown on your page."
            : displayName || "Tap to edit your profile"
        }
        open={openSection === "profile"}
        onToggle={() => toggle("profile")}
      >
        <form onSubmit={(event) => void onSaveProfile(event)} className="grid gap-4">
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

          {profileError ? (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
            >
              {profileError}
            </p>
          ) : null}
          {profileMessage ? (
            <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
              {profileMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="min-h-[48px] w-full bg-[#FAFAF9] text-[#1C1917] hover:bg-white"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Save profile
          </Button>
        </form>
      </SettingsAccordion>

      <SettingsAccordion
        title="Social links"
        summary={
          openSection === "social"
            ? "Shown as icons on your tip section when filled in."
            : "Tap to edit Instagram and Facebook"
        }
        open={openSection === "social"}
        onToggle={() => toggle("social")}
      >
        <form onSubmit={(event) => void onSaveSocial(event)} className="grid gap-4">
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

          {socialError ? (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
            >
              {socialError}
            </p>
          ) : null}
          {socialMessage ? (
            <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
              {socialMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="min-h-[48px] w-full bg-[#FAFAF9] text-[#1C1917] hover:bg-white"
            disabled={savingSocial}
          >
            {savingSocial ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Save social links
          </Button>
        </form>
      </SettingsAccordion>

      <SettingsAccordion
        id="custom-tags"
        title="Custom tags"
        summary={
          openSection === "tags"
            ? `Up to ${MAX_CUSTOM_TAGS} labels (maximum ${MAX_TAG_CHARS} chars each) you can apply when editing songs.`
            : tagCount > 0
              ? `${tagCount} tag${tagCount === 1 ? "" : "s"} · tap to manage`
              : "Tap to add labels for your songs"
        }
        open={openSection === "tags"}
        onToggle={() => toggle("tags")}
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[#A8A29E]">
              Up to {MAX_CUSTOM_TAGS} labels (maximum {MAX_TAG_CHARS} chars each)
              you can apply when editing songs.
            </p>
            <Link
              href="/admin?tab=songs"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-[#A8A29E] transition hover:border-white/25 hover:text-[#FAFAF9]"
            >
              <Music2 size={13} />
              Back to songs
            </Link>
          </div>

          <SongTagEditor
            tags={customTags}
            onChange={onTagsChange}
            maxTags={MAX_CUSTOM_TAGS}
            maxChars={MAX_TAG_CHARS}
          />

          <p className="text-xs text-[#78716C]">
            {tagsStatus === "saving"
              ? "Saving…"
              : tagsStatus === "saved"
                ? "Saved automatically."
                : "Tags save automatically when you add or remove them."}
          </p>

          {tagsError ? (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
            >
              {tagsError}
            </p>
          ) : null}
        </div>
      </SettingsAccordion>
    </div>
  );
}
