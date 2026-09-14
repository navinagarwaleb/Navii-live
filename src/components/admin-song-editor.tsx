"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowDownAZ,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  normalizeCustomTags,
  normalizeTags,
  tagsFromItunesGenre,
} from "@/lib/tags";
import type { Performer, Song } from "@/lib/types";
import { cn } from "@/lib/utils";

type ItunesHit = {
  trackId: number;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  genre: string | null;
};

type DraftSong = {
  hit: ItunesHit;
  tags: string[];
};

type SetlistSort = "newest" | "alpha";

const SONG_SELECT = "id,title,artist,active,tags,artwork_url,performer_id,created_at";

function sortSongs(items: Song[], mode: SetlistSort) {
  const next = [...items];
  if (mode === "alpha") {
    next.sort((a, b) => {
      const byTitle = a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      });
      if (byTitle !== 0) return byTitle;
      return a.artist.localeCompare(b.artist, undefined, {
        sensitivity: "base",
      });
    });
    return next;
  }

  next.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.id.localeCompare(b.id);
  });
  return next;
}

function SongTagPills({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em] text-[#A8A29E]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function AdminSongEditor({ performer }: { performer: Performer }) {
  const performerId = performer.id;
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ItunesHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sort, setSort] = useState<SetlistSort>("newest");
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [draft, setDraft] = useState<DraftSong | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editCatalogTags, setEditCatalogTags] = useState<string[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [portalReady, setPortalReady] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const customTags = useMemo(
    () => normalizeCustomTags(performer.custom_tags ?? []),
    [performer.custom_tags],
  );

  const sortedSongs = useMemo(() => sortSongs(songs, sort), [songs, sort]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoadingSongs(false);
      return;
    }

    void (async () => {
      const { data, error: loadError } = await supabase
        .from("songs")
        .select(SONG_SELECT)
        .eq("performer_id", performerId)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(
          /artwork_url|column .* does not exist|Could not find/i.test(
            loadError.message ?? "",
          )
            ? "Artwork column is missing. Run migration 20260914_songs_artwork_url.sql, then reload."
            : loadError.message,
        );
      } else {
        setSongs((data as Song[]) ?? []);
      }
      setLoadingSongs(false);
    })();
  }, [supabase, performerId]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setSearching(false);
      setOpen(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/itunes/search?term=${encodeURIComponent(term)}&limit=20`,
          );
          const payload = (await response.json()) as {
            results?: ItunesHit[];
            error?: string;
          };
          if (!response.ok) {
            setError(payload.error ?? "Search failed.");
            setHits([]);
            setOpen(false);
          } else {
            setError("");
            const next = payload.results ?? [];
            setHits(next);
            setOpen(next.length > 0 && !draft);
          }
        } catch {
          setError("Could not search iTunes.");
          setHits([]);
          setOpen(false);
        } finally {
          setSearching(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, draft]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (
        searchWrapRef.current &&
        target &&
        !searchWrapRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  function alreadyInRepertoire(title: string, artist: string) {
    const t = title.toLowerCase();
    const a = artist.toLowerCase();
    return songs.some(
      (song) =>
        song.title.toLowerCase() === t && song.artist.toLowerCase() === a,
    );
  }

  function selectHit(hit: ItunesHit) {
    if (alreadyInRepertoire(hit.title, hit.artist)) {
      setMessage("Already in your setlist.");
      return;
    }
    setDraft({
      hit,
      tags: tagsFromItunesGenre(hit.genre),
    });
    setOpen(false);
    setError("");
    setMessage("");
  }

  async function saveDraft() {
    if (!supabase || !draft) return;

    setSavingDraft(true);
    setError("");
    setMessage("");

    const tags = normalizeTags(draft.tags);
    const { data, error: insertError } = await supabase
      .from("songs")
      .insert({
        title: draft.hit.title,
        artist: draft.hit.artist,
        active: true,
        tags,
        artwork_url: draft.hit.artworkUrl,
        performer_id: performerId,
      })
      .select(SONG_SELECT)
      .single();

    if (insertError) {
      setError(
        /artwork_url|column .* does not exist|Could not find/i.test(
          insertError.message ?? "",
        )
          ? "Artwork column is missing. Run migration 20260914_songs_artwork_url.sql, then try again."
          : insertError.message,
      );
    } else if (data) {
      const song = data as Song;
      setSongs((current) => [
        song,
        ...current.filter((item) => item.id !== song.id),
      ]);
      setSort("newest");
      setMessage(`Added “${draft.hit.title}”.`);
      setDraft(null);
      setQuery("");
      setHits([]);
      setOpen(false);
    }
    setSavingDraft(false);
  }

  function openEdit(song: Song) {
    const songTags = new Set(
      (song.tags ?? []).map((tag) => tag.trim().toLowerCase()),
    );
    const catalog = (song.tags ?? []).filter(
      (tag) => !customTags.includes(tag.trim().toLowerCase()),
    );
    setEditingSong(song);
    setEditCatalogTags(normalizeTags(catalog));
    setSelectedCustom(customTags.filter((tag) => songTags.has(tag)));
    setError("");
    setMessage("");
  }

  function toggleCustomTag(tag: string) {
    setSelectedCustom((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function removeCatalogTag(tag: string) {
    setEditCatalogTags((current) => current.filter((item) => item !== tag));
  }

  function removeDraftTag(tag: string) {
    setDraft((current) =>
      current
        ? { ...current, tags: current.tags.filter((item) => item !== tag) }
        : current,
    );
  }

  async function saveEdit() {
    if (!supabase || !editingSong) return;

    setSavingEdit(true);
    setError("");
    setMessage("");

    const tags = normalizeTags([...editCatalogTags, ...selectedCustom]);
    const { data, error: updateError } = await supabase
      .from("songs")
      .update({ tags })
      .eq("id", editingSong.id)
      .eq("performer_id", performerId)
      .select(SONG_SELECT)
      .single();

    if (updateError) {
      setError(updateError.message);
    } else if (data) {
      const song = data as Song;
      setSongs((current) =>
        current.map((item) => (item.id === song.id ? song : item)),
      );
      setMessage(`Updated tags for “${song.title}”.`);
      setEditingSong(null);
    }
    setSavingEdit(false);
  }

  async function removeSong(song: Song) {
    if (!supabase) return;
    setRemovingId(song.id);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("songs")
      .update({ active: false })
      .eq("id", song.id)
      .eq("performer_id", performerId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSongs((current) => current.filter((item) => item.id !== song.id));
      setMessage(`Removed “${song.title}”.`);
      if (editingSong?.id === song.id) setEditingSong(null);
    }
    setRemovingId(null);
  }

  const editModal =
    portalReady && editingSong
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-end bg-black/55 p-4 sm:place-items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-tags-title"
            onClick={() => {
              if (!savingEdit) setEditingSong(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1C1917] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    id="edit-tags-title"
                    className="font-serif text-lg font-semibold text-[#FAFAF9]"
                  >
                    Edit tags
                  </p>
                  <p className="mt-0.5 truncate text-sm text-[#A8A29E]">
                    {editingSong.title}
                    <span className="text-[#57534E]"> · </span>
                    {editingSong.artist}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={savingEdit}
                  onClick={() => setEditingSong(null)}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  From catalog
                </p>
                {editCatalogTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {editCatalogTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeCatalogTag(tag)}
                        aria-label={`Remove catalog tag ${tag}`}
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-[#FAFAF9] transition hover:border-red-300/40 hover:bg-red-500/15 hover:text-red-100"
                      >
                        <span>{tag}</span>
                        <X size={12} className="opacity-70" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#78716C]">No catalog tags left.</p>
                )}
                <p className="mt-1.5 text-[11px] text-[#78716C]">
                  Tap to remove. Catalog tags come from iTunes.
                </p>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Your tags
                </p>
                {customTags.length === 0 ? (
                  <p className="text-sm text-[#A8A29E]">
                    No custom tags yet.{" "}
                    <Link
                      href="/admin/settings#custom-tags"
                      className="font-semibold text-[#FAFAF9] underline underline-offset-2"
                      onClick={() => setEditingSong(null)}
                    >
                      Manage tags in profile
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {customTags.map((tag) => {
                      const active = selectedCustom.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleCustomTag(tag)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-[#E4C29B] bg-[#F3E9DF] text-[#1C1917]"
                              : "border-white/15 bg-transparent text-[#A8A29E] hover:border-white/30 hover:text-[#FAFAF9]",
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-[#78716C]">
                  Tap pills to apply. Create or edit tags in profile.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingSong(null)}
                  className="min-h-[44px] rounded-full border border-white/15 text-sm font-semibold text-[#FAFAF9] transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => void saveEdit()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#FAFAF9] text-sm font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
                >
                  {savingEdit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Save tags
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#FAFAF9]">
          Add songs
        </h2>
        <p className="mt-1 text-sm text-[#A8A29E]">
          Search the iTunes catalog and add tracks guests can request.
        </p>
      </div>

      <div ref={searchWrapRef} className="relative z-50">
        {open && hits.length > 0 && !draft ? (
          <div
            role="listbox"
            aria-label="Song suggestions"
            className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[40vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#1C1917] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            {hits.map((hit) => {
              const exists = alreadyInRepertoire(hit.title, hit.artist);
              return (
                <button
                  key={hit.trackId}
                  type="button"
                  role="option"
                  disabled={exists}
                  onClick={() => selectHit(hit)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition",
                    exists
                      ? "opacity-50"
                      : "hover:bg-white/10 active:bg-white/15",
                  )}
                >
                  {hit.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hit.artworkUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-[#A8A29E]">
                      <Search size={14} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#FAFAF9]">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-[#A8A29E]">
                      {hit.artist}
                      {hit.album ? ` · ${hit.album}` : ""}
                      {hit.genre ? ` · ${hit.genre}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#A8A29E]">
                    {exists ? (
                      "Added"
                    ) : (
                      <Plus size={14} className="text-[#FAFAF9]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#A8A29E]"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (hits.length > 0 && !draft) setOpen(true);
            }}
            placeholder="Search songs or artists…"
            className="border-white/15 bg-[#292524] pl-11 text-[#FAFAF9]"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
          />
          {searching ? (
            <Loader2
              size={16}
              className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-[#A8A29E]"
            />
          ) : null}
        </div>
      </div>

      {draft ? (
        <div className="rounded-2xl border border-white/15 bg-[#292524] p-4">
          <div className="flex items-start gap-3">
            {draft.hit.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.hit.artworkUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/10 text-[#A8A29E]">
                <Search size={18} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#FAFAF9]">
                {draft.hit.title}
              </p>
              <p className="truncate text-sm text-[#A8A29E]">
                {draft.hit.artist}
                {draft.hit.album ? ` · ${draft.hit.album}` : ""}
              </p>
              {draft.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {draft.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeDraftTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#A8A29E] transition hover:border-red-300/40 hover:bg-red-500/15 hover:text-red-100"
                    >
                      <span>{tag}</span>
                      <X size={10} className="opacity-70" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#78716C]">No catalog tags</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Cancel add"
              disabled={savingDraft}
              onClick={() => setDraft(null)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
            >
              <X size={16} />
            </button>
          </div>

          <button
            type="button"
            disabled={savingDraft}
            onClick={() => void saveDraft()}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#FAFAF9] text-sm font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
          >
            {savingDraft ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add to setlist
          </button>
        </div>
      ) : null}

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

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
            Your setlist ({songs.length})
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/settings#custom-tags"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/10 bg-[#1C1917] px-3 text-xs font-semibold text-[#A8A29E] transition hover:border-white/20 hover:text-[#FAFAF9]"
            >
              <Tags size={13} />
              Manage tags
            </Link>

            <div
              role="group"
              aria-label="Sort setlist"
              className="inline-flex rounded-full border border-white/10 bg-[#1C1917] p-0.5"
            >
              <button
                type="button"
                onClick={() => setSort("newest")}
                className={cn(
                  "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
                  sort === "newest"
                    ? "bg-[#FAFAF9] text-[#1C1917]"
                    : "text-[#A8A29E] hover:text-[#FAFAF9]",
                )}
              >
                <Clock3 size={13} />
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSort("alpha")}
                className={cn(
                  "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
                  sort === "alpha"
                    ? "bg-[#FAFAF9] text-[#1C1917]"
                    : "text-[#A8A29E] hover:text-[#FAFAF9]",
                )}
              >
                <ArrowDownAZ size={13} />
                A–Z
              </button>
            </div>
          </div>
        </div>

        {loadingSongs ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[#A8A29E]">
            <Loader2 size={16} className="animate-spin" />
            Loading songs…
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-[#A8A29E]">
            No songs yet. Search above to build your request list.
          </div>
        ) : (
          sortedSongs.map((song) => {
            const tags = song.tags ?? [];
            return (
              <div
                key={song.id}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#292524] px-4 py-3"
              >
                {song.artwork_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.artwork_url}
                    alt=""
                    width={40}
                    height={40}
                    className="mt-0.5 size-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-[#A8A29E]">
                    <Search size={14} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#FAFAF9]">
                    {song.title}
                  </p>
                  <p className="truncate text-sm text-[#A8A29E]">
                    {song.artist}
                  </p>
                  <SongTagPills tags={tags} />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Edit tags for ${song.title}`}
                    onClick={() => openEdit(song)}
                    className="grid size-11 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${song.title}`}
                    disabled={removingId === song.id}
                    onClick={() => void removeSong(song)}
                    className="grid size-11 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-red-200"
                  >
                    {removingId === song.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editModal}
    </div>
  );
}
