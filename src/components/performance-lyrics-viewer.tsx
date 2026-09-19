"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Pause,
  Play,
  X,
} from "lucide-react";
import { isLyricsEmpty, sanitizeLyricsHtml } from "@/lib/lyrics";
import type { SetlistSong } from "@/lib/types";
import { cn } from "@/lib/utils";

type ScrollSpeed = "slow" | "medium" | "fast";

const SPEED_PX_PER_SEC: Record<ScrollSpeed, number> = {
  slow: 18,
  medium: 36,
  fast: 64,
};

const SPEED_OPTIONS: { id: ScrollSpeed; label: string }[] = [
  { id: "slow", label: "Slow" },
  { id: "medium", label: "Med" },
  { id: "fast", label: "Fast" },
];

type PerformanceLyricsViewerProps = {
  open: boolean;
  entries: SetlistSong[];
  activeEntryId: string | null;
  onActiveEntryIdChange: (id: string) => void;
  onClose: () => void;
};

export function PerformanceLyricsViewer({
  open,
  entries,
  activeEntryId,
  onActiveEntryIdChange,
  onClose,
}: PerformanceLyricsViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [speed, setSpeed] = useState<ScrollSpeed>("medium");

  const index = useMemo(() => {
    if (!activeEntryId) return -1;
    return entries.findIndex((entry) => entry.id === activeEntryId);
  }, [activeEntryId, entries]);

  const entry = index >= 0 ? entries[index] : null;
  const song = entry?.song ?? null;
  const hasLyrics = Boolean(song?.lyrics && !isLyricsEmpty(song.lyrics));
  const canPrev = index > 0;
  const canNext = index >= 0 && index < entries.length - 1;

  // Reset scroll position when the active song changes; keep auto-scroll preference.
  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = 0;
  }, [open, activeEntryId]);

  // Stop auto-scroll when the viewer closes or there are no lyrics.
  useEffect(() => {
    if (!open || !hasLyrics) setAutoScroll(false);
  }, [open, hasLyrics]);

  // Smooth auto-scroll loop.
  useEffect(() => {
    if (!open || !autoScroll || !hasLyrics) return;

    let frame = 0;
    let last = performance.now();
    const pxPerSec = SPEED_PX_PER_SEC[speed];

    function tick(now: number) {
      const node = scrollRef.current;
      if (!node) return;

      const elapsed = Math.min(now - last, 64);
      last = now;
      const maxScroll = node.scrollHeight - node.clientHeight;

      if (maxScroll <= 0) {
        setAutoScroll(false);
        return;
      }

      const next = node.scrollTop + (pxPerSec * elapsed) / 1000;
      if (next >= maxScroll - 0.5) {
        node.scrollTop = maxScroll;
        setAutoScroll(false);
        return;
      }

      node.scrollTop = next;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, autoScroll, hasLyrics, speed]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === " ") {
        // Space toggles auto-scroll when lyrics are present.
        if (!hasLyrics) return;
        event.preventDefault();
        setAutoScroll((current) => !current);
        return;
      }
      if (event.key === "ArrowLeft" && canPrev) {
        event.preventDefault();
        onActiveEntryIdChange(entries[index - 1]!.id);
      }
      if (event.key === "ArrowRight" && canNext) {
        event.preventDefault();
        onActiveEntryIdChange(entries[index + 1]!.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    canPrev,
    canNext,
    entries,
    index,
    hasLyrics,
    onActiveEntryIdChange,
    onClose,
  ]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="performance-lyrics-title"
      onClick={onClose}
    >
      <div
        className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-[#1C1917] shadow-[0_20px_60px_rgba(0,0,0,0.55)] sm:h-[min(92dvh,860px)] sm:rounded-2xl sm:border sm:border-white/15"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#A8A29E] uppercase">
              Lyrics & Chords · read only
            </p>
            <h2
              id="performance-lyrics-title"
              className="mt-1 truncate font-serif text-xl font-semibold tracking-[-0.01em] text-[#FAFAF9] sm:text-2xl"
            >
              {song?.title ?? "Song"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-[#A8A29E]">
              {song?.artist ?? "—"}
              {entries.length > 0 && index >= 0
                ? ` · ${index + 1} of ${entries.length}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close lyrics"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
          >
            <X size={18} />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          onWheel={() => {
            if (!autoScroll) return;
            setAutoScroll(false);
          }}
          onTouchMove={() => {
            if (!autoScroll) return;
            setAutoScroll(false);
          }}
        >
          {hasLyrics ? (
            <div
              className="lyrics-readonly text-[#FAFAF9]"
              dangerouslySetInnerHTML={{
                __html: sanitizeLyricsHtml(song!.lyrics!),
              }}
            />
          ) : (
            <div className="grid h-full min-h-[40vh] place-items-center px-4 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/10 text-[#A8A29E]">
                  <FileText size={20} />
                </span>
                <p className="mt-4 text-sm font-semibold text-[#FAFAF9]">
                  No lyrics & chords for this song
                </p>
                <p className="mt-1 text-sm text-[#A8A29E]">
                  Add them from Songs, or jump to another track.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            disabled={!hasLyrics}
            aria-pressed={autoScroll}
            onClick={() => setAutoScroll((current) => !current)}
            className={cn(
              "inline-flex h-9 min-h-[36px] items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-35",
              autoScroll
                ? "bg-[#F2B76E] text-[#1C1917]"
                : "border border-white/15 text-[#FAFAF9] hover:bg-white/10",
            )}
          >
            {autoScroll ? <Pause size={14} /> : <Play size={14} />}
            {autoScroll ? "Pause scroll" : "Auto-scroll"}
          </button>

          <div
            className="inline-flex rounded-full border border-white/10 bg-[#141210] p-0.5"
            role="group"
            aria-label="Auto-scroll speed"
          >
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={!hasLyrics}
                aria-pressed={speed === option.id}
                onClick={() => setSpeed(option.id)}
                className={cn(
                  "inline-flex h-8 min-h-[32px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold leading-none transition disabled:opacity-35 sm:px-3 sm:text-[12px]",
                  speed === option.id
                    ? "bg-white/15 text-[#FAFAF9]"
                    : "text-[#A8A29E] hover:text-[#FAFAF9]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => {
              if (canPrev) onActiveEntryIdChange(entries[index - 1]!.id);
            }}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 text-sm font-semibold text-[#FAFAF9] transition",
              canPrev
                ? "hover:bg-white/10"
                : "cursor-not-allowed opacity-35",
            )}
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => {
              if (canNext) onActiveEntryIdChange(entries[index + 1]!.id);
            }}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FAFAF9] text-sm font-bold text-[#1C1917] transition",
              canNext ? "hover:bg-white" : "cursor-not-allowed opacity-35",
            )}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
