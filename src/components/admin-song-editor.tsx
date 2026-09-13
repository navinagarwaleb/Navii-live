"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
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

export function AdminSongEditor({ performerId }: { performerId: string }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ItunesHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoadingSongs(false);
      return;
    }

    void (async () => {
      const { data, error: loadError } = await supabase
        .from("songs")
        .select("id,title,artist,active,tags,performer_id")
        .eq("performer_id", performerId)
        .eq("active", true)
        .order("title", { ascending: true });

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
          } else {
            setError("");
            setHits(payload.results ?? []);
          }
        } catch {
          setError("Could not search iTunes.");
          setHits([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

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
      .select("id,title,artist,active,tags,performer_id")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setSongs((current) =>
        [...current, data as Song].sort((a, b) =>
          a.title.localeCompare(b.title),
        ),
      );
      setMessage(`Added “${hit.title}”.`);
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

      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#A8A29E]"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs or artists…"
          className="border-white/15 bg-[#292524] pl-11 text-[#FAFAF9]"
        />
        {searching ? (
          <Loader2
            size={16}
            className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-[#A8A29E]"
          />
        ) : null}
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

      {hits.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
            Search results
          </p>
          {hits.map((hit) => {
            const exists = alreadyInRepertoire(hit.title, hit.artist);
            return (
              <div
                key={hit.trackId}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#292524] p-3"
              >
                {hit.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hit.artworkUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-lg bg-white/10 text-[#A8A29E]">
                    <Search size={16} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#FAFAF9]">
                    {hit.title}
                  </p>
                  <p className="truncate text-sm text-[#A8A29E]">
                    {hit.artist}
                    {hit.album ? ` · ${hit.album}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={exists || addingId === hit.trackId}
                  onClick={() => void addSong(hit)}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
                    exists
                      ? "bg-white/10 text-[#A8A29E]"
                      : "bg-[#FAFAF9] text-[#1C1917] hover:bg-white",
                  )}
                >
                  {addingId === hit.trackId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {exists ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
            Your setlist
          </p>
          <span className="text-sm font-bold text-[#A8A29E]">{songs.length}</span>
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
          songs.map((song) => (
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
