"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, Clock3, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

type ItunesHit = {
  trackId: number;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  genre: string | null;
};

type SetlistSort = "newest" | "alpha";

const SONG_SELECT = "id,title,artist,active,tags,performer_id,created_at";

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
    return b.id.localeCompare(a.id);
  });
  return next;
}

export function AdminSongEditor({ performerId }: { performerId: string }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ItunesHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sort, setSort] = useState<SetlistSort>("newest");
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const sortedSongs = useMemo(() => sortSongs(songs, sort), [songs, sort]);

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
        setError(loadError.message);
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
            setOpen(next.length > 0);
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
  }, [query]);

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

  async function addSong(hit: ItunesHit) {
    if (!supabase) return;
    if (alreadyInRepertoire(hit.title, hit.artist)) {
      setMessage("Already in your setlist.");
      return;
    }

    setAddingId(hit.trackId);
    setError("");
    setMessage("");

    const tags = hit.genre ? [hit.genre] : [];
    const { data, error: insertError } = await supabase
      .from("songs")
      .insert({
        title: hit.title,
        artist: hit.artist,
        active: true,
        tags,
        performer_id: performerId,
      })
      .select(SONG_SELECT)
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      const song = data as Song;
      setSongs((current) => [song, ...current.filter((item) => item.id !== song.id)]);
      setSort("newest");
      setMessage(`Added “${hit.title}”.`);
      setQuery("");
      setHits([]);
      setOpen(false);
    }
    setAddingId(null);
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
    }
    setRemovingId(null);
  }

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
        {open && hits.length > 0 ? (
          <div
            role="listbox"
            aria-label="Song suggestions"
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[40vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#1C1917] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            {hits.map((hit) => {
              const exists = alreadyInRepertoire(hit.title, hit.artist);
              return (
                <button
                  key={hit.trackId}
                  type="button"
                  role="option"
                  disabled={exists || addingId === hit.trackId}
                  onClick={() => void addSong(hit)}
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
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#A8A29E]">
                    {addingId === hit.trackId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : exists ? (
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
              if (hits.length > 0) setOpen(true);
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
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
              Your setlist
            </p>
            <span className="text-sm font-bold text-[#A8A29E]">
              {songs.length}
            </span>
          </div>

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
          sortedSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#292524] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#FAFAF9]">
                  {song.title}
                </p>
                <p className="truncate text-sm text-[#A8A29E]">{song.artist}</p>
              </div>
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
          ))
        )}
      </div>
    </div>
  );
}
