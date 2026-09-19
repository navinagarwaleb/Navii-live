"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowDownAZ,
  Clock3,
  FileText,
  Loader2,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LyricsEditor } from "@/components/lyrics-editor";
import { adminSettingsHref } from "@/lib/admin-nav";
import { adminChipClass, adminSegmentClass, adminSegmentGroupClass } from "@/lib/admin-ui";
import { useEphemeralMessage } from "@/hooks/use-ephemeral-message";
import { isLyricsEmpty } from "@/lib/lyrics";
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
  catalogTags: string[];
  selectedCustom: string[];
};

type ListSort = "newest" | "alpha";

const SONG_SELECT =
  "id,title,artist,active,tags,artwork_url,lyrics,performer_id,created_at";

function sortSongs(items: Song[], mode: ListSort) {
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

function songSubtitle(artist: string, tags: string[]) {
  if (tags.length === 0) return artist;
  return `${artist} · ${tags.join(" · ")}`;
}

function normalizeLyricsForCompare(value: string | null | undefined) {
  return isLyricsEmpty(value) ? "" : (value ?? "").trim();
}

function sameTagList(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((tag, index) => tag === b[index]);
}

export function AdminSongEditor({ performer }: { performer: Performer }) {
  const performerId = performer.id;
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ItunesHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sort, setSort] = useState<ListSort>("newest");
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [draft, setDraft] = useState<DraftSong | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editCatalogTags, setEditCatalogTags] = useState<string[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<string[]>([]);
  const [editLyrics, setEditLyrics] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmLeaveEdit, setConfirmLeaveEdit] = useState(false);
  const [editBaseline, setEditBaseline] = useState<{
    lyrics: string;
    catalogTags: string[];
    selectedCustom: string[];
  } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemoveSong, setPendingRemoveSong] = useState<Song | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useEphemeralMessage();
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
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(
          /artwork_url|lyrics|column .* does not exist|Could not find/i.test(
            loadError.message ?? "",
          )
            ? "Songs table is missing a column. Run the latest songs migrations in Supabase, then reload."
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
      setMessage("Already in your list.");
      return;
    }
    setDraft({
      hit,
      catalogTags: tagsFromItunesGenre(hit.genre),
      selectedCustom: [],
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

    const tags = normalizeTags([
      ...draft.catalogTags,
      ...draft.selectedCustom,
    ]);
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
    const catalog = normalizeTags(
      (song.tags ?? []).filter(
        (tag) => !customTags.includes(tag.trim().toLowerCase()),
      ),
    );
    const selected = customTags.filter((tag) => songTags.has(tag));
    const lyrics = song.lyrics ?? "";
    setEditingSong(song);
    setEditCatalogTags(catalog);
    setSelectedCustom(selected);
    setEditLyrics(lyrics);
    setEditBaseline({
      lyrics,
      catalogTags: catalog,
      selectedCustom: selected,
    });
    setConfirmLeaveEdit(false);
    setError("");
    setMessage("");
  }

  function isEditDirty() {
    if (!editingSong || !editBaseline) return false;
    if (
      normalizeLyricsForCompare(editLyrics) !==
      normalizeLyricsForCompare(editBaseline.lyrics)
    ) {
      return true;
    }
    if (!sameTagList(editCatalogTags, editBaseline.catalogTags)) return true;
    if (!sameTagList(selectedCustom, editBaseline.selectedCustom)) return true;
    return false;
  }

  function closeEditModal() {
    setConfirmLeaveEdit(false);
    setEditBaseline(null);
    setEditingSong(null);
  }

  function requestCloseEdit() {
    if (savingEdit || (editingSong && removingId === editingSong.id)) return;
    if (isEditDirty()) {
      setConfirmLeaveEdit(true);
      return;
    }
    closeEditModal();
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
        ? {
            ...current,
            catalogTags: current.catalogTags.filter((item) => item !== tag),
          }
        : current,
    );
  }

  function toggleDraftCustomTag(tag: string) {
    setDraft((current) => {
      if (!current) return current;
      const selected = current.selectedCustom.includes(tag)
        ? current.selectedCustom.filter((item) => item !== tag)
        : [...current.selectedCustom, tag];
      return { ...current, selectedCustom: selected };
    });
  }

  async function saveEdit() {
    if (!supabase || !editingSong) return;

    setSavingEdit(true);
    setError("");
    setMessage("");

    const tags = normalizeTags([...editCatalogTags, ...selectedCustom]);
    const lyrics = isLyricsEmpty(editLyrics) ? null : editLyrics;
    const { data, error: updateError } = await supabase
      .from("songs")
      .update({ tags, lyrics })
      .eq("id", editingSong.id)
      .eq("performer_id", performerId)
      .select(SONG_SELECT)
      .single();

    if (updateError) {
      setError(
        /lyrics|column .* does not exist|Could not find/i.test(
          updateError.message ?? "",
        )
          ? "Lyrics column is missing. Run migration 20260918_songs_lyrics.sql, then try again."
          : updateError.message,
      );
    } else if (data) {
      const song = data as Song;
      setSongs((current) =>
        current.map((item) => (item.id === song.id ? song : item)),
      );
      setMessage(`Updated “${song.title}”.`);
      closeEditModal();
    }
    setSavingEdit(false);
  }

  async function toggleSongActive(song: Song) {
    if (!supabase) return;
    const nextActive = !(song.active ?? true);
    setTogglingId(song.id);
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("songs")
      .update({ active: nextActive })
      .eq("id", song.id)
      .eq("performer_id", performerId)
      .select(SONG_SELECT)
      .single();

    if (updateError) {
      setError(updateError.message);
    } else if (data) {
      const updated = data as Song;
      setSongs((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (editingSong?.id === updated.id) {
        setEditingSong(updated);
      }
      setMessage(
        nextActive
          ? `“${song.title}” is available for requests.`
          : `“${song.title}” is hidden from requests.`,
      );
    }
    setTogglingId(null);
  }

  async function removeSong(song: Song) {
    if (!supabase) return;

    setRemovingId(song.id);
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", song.id)
      .eq("performer_id", performerId);

    if (deleteError) {
      setError(deleteError.message);
      setRemovingId(null);
      return;
    }

    setSongs((current) => current.filter((item) => item.id !== song.id));
    setMessage(`Removed “${song.title}”.`);
    if (editingSong?.id === song.id) closeEditModal();
    setPendingRemoveSong(null);
    setRemovingId(null);
  }

  const editModal =
    portalReady && editingSong
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-song-title"
            onClick={() => {
              requestCloseEdit();
            }}
          >
            <div
              className="max-h-[min(90dvh,760px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#1C1917] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {editingSong.artwork_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editingSong.artwork_url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-white/10 text-[#A8A29E]">
                      <Search size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p
                      id="edit-song-title"
                      className="font-serif text-lg font-semibold text-[#FAFAF9]"
                    >
                      {editingSong.title}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-[#A8A29E]">
                      {editingSong.artist}
                    </p>
                    <p className="mt-1 text-[11px] text-[#78716C]">
                      {(editingSong.active ?? true)
                        ? "Visible for requests"
                        : "Hidden from requests"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={savingEdit || removingId === editingSong.id}
                  onClick={() => requestCloseEdit()}
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
                      href={adminSettingsHref({ from: "songs", hash: "custom-tags" })}
                      className="font-semibold text-[#FAFAF9] underline underline-offset-2"
                      onClick={(event) => {
                        if (isEditDirty()) {
                          event.preventDefault();
                          setConfirmLeaveEdit(true);
                        } else {
                          closeEditModal();
                        }
                      }}
                    >
                      Manage tags in profile
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {customTags.map((tag) => {
                      const selected = selectedCustom.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleCustomTag(tag)}
                          aria-pressed={selected}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            selected
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

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Lyrics & Chords
                </p>
                <LyricsEditor
                  key={editingSong.id}
                  value={editLyrics}
                  onChange={setEditLyrics}
                  disabled={savingEdit || removingId === editingSong.id}
                />
                <p className="mt-1.5 text-[11px] text-[#78716C]">
                  Optional. Use formatting and emoji. Saved with the song.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={savingEdit || removingId === editingSong.id}
                  onClick={() => requestCloseEdit()}
                  className="min-h-[44px] rounded-full border border-white/15 text-sm font-semibold text-[#FAFAF9] transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit || removingId === editingSong.id}
                  onClick={() => void saveEdit()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#FAFAF9] text-sm font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
                >
                  {savingEdit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Save
                </button>
              </div>

              <button
                type="button"
                disabled={savingEdit || removingId === editingSong.id}
                onClick={() => setPendingRemoveSong(editingSong)}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-red-400/30 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-40"
              >
                {removingId === editingSong.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Remove from list
              </button>
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
        <div className="rounded-xl border border-white/15 bg-[#292524] px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            {draft.hit.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.hit.artworkUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
                <Search size={14} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
                {draft.hit.title}
              </p>
              <p className="truncate text-xs leading-snug text-[#A8A29E]">
                {draft.hit.artist}
                {draft.hit.album ? ` · ${draft.hit.album}` : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cancel add"
              disabled={savingDraft}
              onClick={() => setDraft(null)}
              className="grid size-8 shrink-0 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-2">
            <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
              Catalog
            </p>
            {draft.catalogTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {draft.catalogTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeDraftTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#FAFAF9] transition hover:border-red-300/40 hover:bg-red-500/15 hover:text-red-100"
                  >
                    <span>{tag}</span>
                    <X size={10} className="opacity-70" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#78716C]">No catalog tags</p>
            )}
          </div>

          <div className="mt-2">
            <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
              Your tags
            </p>
            {customTags.length === 0 ? (
              <p className="text-[11px] text-[#A8A29E]">
                No custom tags yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {customTags.map((tag) => {
                  const selected = draft.selectedCustom.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDraftCustomTag(tag)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition",
                        selected
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
          </div>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={savingDraft}
              onClick={() => void saveDraft()}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FAFAF9] text-xs font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
            >
              {savingDraft ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add to list
            </button>
            <Link
              href={adminSettingsHref({ from: "songs", hash: "custom-tags" })}
              className={adminChipClass("h-9 min-w-0 flex-1 justify-center border-white/15 bg-transparent hover:bg-white/5")}
            >
              <Tags size={13} />
              Manage tags
            </Link>
          </div>
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

      <div className="grid gap-1">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
            Your list ({songs.length})
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={adminSettingsHref({ from: "songs", hash: "custom-tags" })}
              className={adminChipClass()}
            >
              <Tags size={13} aria-hidden />
              <span>Manage tags</span>
            </Link>

            <div
              role="group"
              aria-label="Sort list"
              className={adminSegmentGroupClass()}
            >
              <button
                type="button"
                onClick={() => setSort("newest")}
                className={adminSegmentClass(sort === "newest")}
              >
                <Clock3 size={13} aria-hidden />
                <span>Newest</span>
              </button>
              <button
                type="button"
                onClick={() => setSort("alpha")}
                className={adminSegmentClass(sort === "alpha")}
              >
                <ArrowDownAZ size={13} aria-hidden />
                <span>A–Z</span>
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
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#292524]">
            {sortedSongs.map((song, index) => {
              const tags = song.tags ?? [];
              const isActive = song.active ?? true;
              const isToggling = togglingId === song.id;
              return (
                <div
                  key={song.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(song)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEdit(song);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-2.5 py-1.5 transition hover:bg-white/5",
                    index > 0 && "border-t border-white/5",
                    !isActive && "opacity-45",
                  )}
                >
                  {song.artwork_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={song.artwork_url}
                      alt=""
                      width={44}
                      height={44}
                      className={cn(
                        "size-11 shrink-0 rounded-md object-cover",
                        !isActive && "grayscale",
                      )}
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
                      <Search size={14} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
                      {song.title}
                    </p>
                    <p className="truncate text-xs leading-snug text-[#A8A29E]">
                      {songSubtitle(song.artist, tags)}
                    </p>
                  </div>
                  {song.lyrics && !isLyricsEmpty(song.lyrics) ? (
                    <span
                      title="Has lyrics & chords"
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-[#E4C29B]"
                    >
                      <FileText size={13} />
                    </span>
                  ) : null}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label={
                      isActive
                        ? `Hide ${song.title} from requests`
                        : `Show ${song.title} for requests`
                    }
                    disabled={isToggling}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleSongActive(song);
                    }}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition",
                      isActive ? "bg-emerald-500/80" : "bg-white/15",
                      isToggling && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 grid size-6 place-items-center rounded-full bg-[#FAFAF9] shadow transition",
                        isActive && "translate-x-5",
                      )}
                    >
                      {isToggling ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-[#1C1917]"
                        />
                      ) : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editModal}

      <ConfirmDialog
        open={confirmLeaveEdit}
        title="Save changes?"
        description="You have unsaved lyrics or tag edits. Save before leaving?"
        confirmLabel="Save"
        secondaryLabel="Don't save"
        busy={savingEdit}
        onCancel={() => setConfirmLeaveEdit(false)}
        onSecondary={() => closeEditModal()}
        onConfirm={() => void saveEdit()}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoveSong)}
        title="Remove song?"
        description={
          pendingRemoveSong
            ? `Remove “${pendingRemoveSong.title}” from your list? This cannot be undone.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Keep"
        tone="danger"
        busy={Boolean(pendingRemoveSong && removingId === pendingRemoveSong.id)}
        onCancel={() => {
          if (!removingId) setPendingRemoveSong(null);
        }}
        onConfirm={() => {
          if (pendingRemoveSong) void removeSong(pendingRemoveSong);
        }}
      />
    </div>
  );
}
