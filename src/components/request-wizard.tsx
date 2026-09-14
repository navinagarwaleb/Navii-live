"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  ExternalLink,
  Heart,
  Loader2,
  Music,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getSocialLinks, hasSocialLinks } from "@/lib/social";
import { hasTipMethods, tipMethodLinks } from "@/lib/tips";
import type { Performer, Song, SongRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FacebookMark,
  InstagramMark,
  SocialIconButton,
  TipAmountGlyph,
  TipMethodIcon,
} from "@/components/tip-method-icons";

const TIP_PRESETS = [
  { amount: 5 as const, label: "$5" },
  { amount: 10 as const, label: "$10" },
  { amount: 20 as const, label: "$20" },
] as const;
const MIN_CUSTOM_TIP = 5;
const CUSTOM_TIP_MAX_CHARS = 6;
const MAX_DEDICATION_CHARS = 80;

/** Digits + optional single decimal, max 6 chars (e.g. 999.99). */
function sanitizeCustomTipInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  const normalized =
    firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot + 1)}${cleaned
          .slice(firstDot + 1)
          .replace(/\./g, "")}`;
  return normalized.slice(0, CUSTOM_TIP_MAX_CHARS);
}

const TOTAL_STEPS = 5;

const STEP_LABELS: Record<number, string> = {
  1: "What’s the occasion?",
  2: "What song are we playing?",
  3: "Who is this from?",
  4: "Add a dedication?",
  5: "Your request is in!",
};

/** Preferred chip order when present; any other Supabase tags still appear after. */
const PREFERRED_TAG_ORDER = [
  "sing-alongs",
  "classic rock",
  "pub anthems",
  "crowd favourites",
  "romantic & slow",
  "late night vibe",
  "new / fresh",
] as const;

const occasions = [
  { emoji: "🎸", label: "Just Because" },
  { emoji: "🎂", label: "Birthday" },
  { emoji: "🍷", label: "Date Night" },
  { emoji: "💞", label: "Anniversary" },
  { emoji: "🔥", label: "Table Hype / Party Starter" },
  { emoji: "🌙", label: "Late Night Request" },
];

const demoSongs: Song[] = [
  {
    id: "demo-1",
    title: "Perfect",
    artist: "Ed Sheeran",
    tags: ["romantic & slow", "sing-alongs"],
  },
  {
    id: "demo-2",
    title: "Until I Found You",
    artist: "Stephen Sanchez",
    tags: ["romantic & slow"],
  },
  {
    id: "demo-3",
    title: "A Thousand Years",
    artist: "Christina Perri",
    tags: ["sing-alongs", "romantic & slow"],
  },
  {
    id: "demo-4",
    title: "Can’t Help Falling in Love",
    artist: "Elvis Presley",
    tags: ["classic rock", "sing-alongs"],
  },
  {
    id: "demo-5",
    title: "Yellow",
    artist: "Coldplay",
    tags: ["sing-alongs", "crowd favourites"],
  },
  {
    id: "demo-6",
    title: "You Are the Reason",
    artist: "Calum Scott",
    tags: ["romantic & slow"],
  },
  {
    id: "demo-7",
    title: "All of Me",
    artist: "John Legend",
    tags: ["sing-alongs", "romantic & slow"],
  },
  {
    id: "demo-8",
    title: "Lover",
    artist: "Taylor Swift",
    tags: ["sing-alongs", "new / fresh"],
  },
  {
    id: "demo-9",
    title: "I Won’t Give Up",
    artist: "Jason Mraz",
    tags: ["late night vibe"],
  },
  {
    id: "demo-10",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    tags: ["pub anthems", "sing-alongs"],
  },
];

function SelectionTile({
  selected,
  onClick,
  children,
  className,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex min-h-[92px] touch-manipulation flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-[1.5px] border-border bg-field px-2 py-3.5 text-center shadow-xs transition-all duration-150 outline-none",
        "hover:border-line-strong hover:bg-selected focus-visible:ring-4 focus-visible:ring-accent/30 active:scale-[0.97]",
        selected && "scale-[1.02] border-line-strong bg-selected shadow-none",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-left">
      <p className="text-[0.72rem] font-bold tracking-[0.08em] text-mist uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-serif text-[clamp(1.5rem,5.6vw,1.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
        {title}
      </h1>
      {description ? (
        <p className="mt-[7px] text-[0.95rem] leading-[1.4] text-mist">
          {description}
        </p>
      ) : null}
      <div className="mt-4 -mx-[18px] border-b border-border sm:-mx-5" />
    </div>
  );
}

export function RequestWizard({ performer }: { performer: Performer }) {
  const showTips = hasTipMethods(performer);
  const social = getSocialLinks(performer);
  const showSocial = hasSocialLinks(performer);
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [song, setSong] = useState<Song | null>(null);
  const [genreFilter, setGenreFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [dedication, setDedication] = useState("");
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(
    null,
  );
  const [customTip, setCustomTip] = useState("");
  const [customTipError, setCustomTipError] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] =
    useState<SongRequest | null>(null);
  const [error, setError] = useState("");

  const tipLinks = tipMethodLinks(performer, selectedTipAmount);

  function selectPresetTip(amount: number) {
    setSelectedTipAmount(amount);
    setCustomTip("");
    setCustomTipError("");
  }

  function onCustomTipChange(value: string) {
    const next = sanitizeCustomTipInput(value);
    setCustomTip(next);
    const trimmed = next.trim();
    if (!trimmed || trimmed === ".") {
      setCustomTipError("");
      setSelectedTipAmount(null);
      return;
    }
    const amount = Number(trimmed);
    if (!Number.isFinite(amount) || amount < MIN_CUSTOM_TIP) {
      setCustomTipError(`Enter $${MIN_CUSTOM_TIP} or more`);
      setSelectedTipAmount(null);
      return;
    }
    setCustomTipError("");
    setSelectedTipAmount(amount);
  }

  useEffect(() => {
    const label = STEP_LABELS[step] ?? "Request a song";
    document.title = `${label} · ${performer.display_name}`;
  }, [step, performer.display_name]);

  useEffect(() => {
    let active = true;

    async function loadSongs() {
      if (!supabase) {
        if (active) {
          setSongs(demoSongs);
          setLoadingSongs(false);
        }
        return;
      }

      const { data, error: songsError } = await supabase
        .from("songs")
        .select("id,title,artist,active,tags,performer_id")
        .eq("active", true)
        .eq("performer_id", performer.id)
        .order("title", { ascending: true })
        .limit(1000);

      if (!active) return;
      if (songsError) {
        console.error(
          "Unable to load active songs:",
          JSON.stringify(songsError, null, 2),
          songsError.message,
          songsError.details,
          songsError.hint,
          songsError.code,
        );
      }

      const nextSongs =
        songsError || !data?.length
          ? demoSongs
          : (data as Song[]).map((item) => ({
              ...item,
              tags: item.tags ?? [],
            }));

      setSongs(nextSongs);
      setLoadingSongs(false);
    }

    void loadSongs();
    return () => {
      active = false;
    };
  }, [supabase, performer.id]);

  useEffect(() => {
    if (step !== 5) return;

    let cancelled = false;
    let timer = 0;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const end = Date.now() + 1800;
      const colors = ["#0D1B2E", "#F2B76E", "#FFC89B", "#F7F4F0"];
      timer = window.setInterval(() => {
        if (Date.now() > end) {
          window.clearInterval(timer);
          return;
        }
        void confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0 },
          colors,
        });
        void confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1 },
          colors,
        });
      }, 120);
    });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [step]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { All: songs.length };
    for (const item of songs) {
      for (const tag of item.tags ?? []) {
        const key = tag.trim();
        if (!key) continue;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return songs.filter((item) => {
      const matchesGenre =
        genreFilter === "All" ||
        (item.tags ?? []).some(
          (tag) => tag.toLowerCase() === genreFilter.toLowerCase(),
        );

      if (!matchesGenre) return false;
      if (!query) return true;

      return (
        item.title.toLowerCase().includes(query) ||
        item.artist.toLowerCase().includes(query)
      );
    });
  }, [genreFilter, searchQuery, songs]);

  const availableFilters = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const item of songs) {
      for (const raw of item.tags ?? []) {
        const tag = raw.trim();
        if (!tag) continue;
        const key = tag.toLowerCase();
        if (!byKey.has(key)) byKey.set(key, tag);
      }
    }

    const preferred = PREFERRED_TAG_ORDER.map((key) => byKey.get(key)).filter(
      (tag): tag is string => Boolean(tag),
    );
    const preferredKeys = new Set(PREFERRED_TAG_ORDER);
    const extras = [...byKey.entries()]
      .filter(([key]) => !preferredKeys.has(key as (typeof PREFERRED_TAG_ORDER)[number]))
      .map(([, tag]) => tag)
      .sort((a, b) => a.localeCompare(b));

    return ["All", ...preferred, ...extras];
  }, [songs]);

  const canContinue =
    (step === 1 && Boolean(occasion)) ||
    (step === 2 && Boolean(song)) ||
    (step === 3 && Boolean(requesterName.trim()));

  const continueHint =
    step === 1 && !occasion
      ? "Pick a vibe to continue"
      : step === 2 && !song
        ? "Pick a song to continue"
        : step === 3 && !requesterName.trim()
          ? "Add your name to continue"
          : undefined;

  function resetWizard() {
    setStep(1);
    setOccasion("");
    setSong(null);
    setGenreFilter("All");
    setSearchQuery("");
    setRequesterName("");
    setDedication("");
    setSubmittedRequest(null);
    setError("");
    setCustomTip("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitRequest(dedicationOverride?: string) {
    if (!song || !occasion || !requesterName.trim()) return;

    setSubmitting(true);
    setError("");
    const dedicationValue =
      dedicationOverride !== undefined ? dedicationOverride : dedication;

    if (supabase) {
      const { data: insertedRequest, error: submitError } = await supabase
        .from("requests")
        .insert({
          occasion,
          song_id: song.id.startsWith("demo-") ? null : song.id,
          song_title: song.title,
          artist: song.artist,
          requester_name: requesterName.trim(),
          dedication: dedicationValue.trim() || null,
          status: "pending",
          performer_id: performer.id,
        })
        .select("*")
        .single();

      if (submitError || !insertedRequest) {
        console.error(
          "Unable to submit song request:",
          JSON.stringify(submitError, null, 2),
          submitError?.message,
          submitError?.details,
          submitError?.hint,
        );
        setError("We couldn’t send your request. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmittedRequest(insertedRequest as SongRequest);
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    }

    setSubmitting(false);
    goToStep(5);
  }

  if (step === 5) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-col flex-col items-center justify-center px-6 py-10 pb-16 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-surface text-[#B8862F] shadow-soft">
          <CircleCheckBig size={30} />
        </div>
        <Badge className="mt-6">Request received</Badge>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,6vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Your song is in the queue!
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          {performer.display_name} has your request for{" "}
          <strong className="font-semibold text-ink">
            {submittedRequest?.song_title ?? song?.title}
          </strong>
          {" by "}
          <strong className="font-semibold text-ink">
            {submittedRequest?.artist ?? song?.artist}
          </strong>
          . Listen out for your moment.
        </p>

        {showTips ? (
          <Card className="mt-10 w-full rounded-2xl border border-border bg-field p-6 text-left shadow-none">
            <div className="flex gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-[#B8862F]">
                <Heart size={18} />
              </span>
              <div>
                <h2 className="font-serif text-lg leading-[1.3] font-semibold text-deep-blue">
                  Feel generous?
                </h2>
                <p className="mt-1 text-sm leading-[1.5] text-mist">
                  Drop a tip to support the artist.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_1fr_1fr_auto] items-stretch gap-2">
              {TIP_PRESETS.map((tip) => {
                const selected =
                  selectedTipAmount === tip.amount && customTip.trim() === "";
                return (
                  <button
                    key={tip.amount}
                    type="button"
                    onClick={() => selectPresetTip(tip.amount)}
                    className={cn(
                      "inline-flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 text-sm font-semibold transition active:scale-[0.97]",
                      selected
                        ? "border-[#E4C29B] bg-[#F3E9DF] text-deep-blue"
                        : "border-border bg-surface text-ink hover:border-line-strong hover:bg-selected",
                    )}
                  >
                    <TipAmountGlyph
                      amount={tip.amount}
                      className="text-[#B8862F]"
                    />
                    {tip.label}
                  </button>
                );
              })}
              <label className="relative block h-[56px] w-[6.25rem]">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 z-[1] -translate-y-1/2 text-xs font-semibold text-mist"
                >
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={MIN_CUSTOM_TIP}
                  step="1"
                  max={999999}
                  placeholder="Custom"
                  value={customTip}
                  onChange={(event) => onCustomTipChange(event.target.value)}
                  aria-invalid={Boolean(customTipError)}
                  aria-label="Custom tip amount"
                  className={cn(
                    "box-border h-full w-full rounded-full border bg-field py-0 pl-[1.35rem] pr-0.5 text-left text-xs font-semibold tabular-nums text-ink shadow-xs outline-none transition placeholder:text-mist focus:border-line-strong focus:ring-4 focus:ring-accent/25 [&::-webkit-inner-spin-button]:h-8 [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100",
                    customTipError ? "border-red-400" : "border-border",
                  )}
                />
              </label>
            </div>
            {customTipError ? (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                {customTipError}
              </p>
            ) : null}

            {selectedTipAmount != null ? (
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-medium text-mist">
                  Send ${selectedTipAmount} with
                </p>
                <div className="grid gap-2">
                  {tipLinks.map((method) => (
                    <a
                      key={method.id}
                      href={method.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-selected active:scale-[0.98]"
                    >
                      <span className="inline-flex items-center gap-3">
                        <TipMethodIcon id={method.id} />
                        {method.label}
                      </span>
                      <ExternalLink size={15} className="text-mist" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {showSocial ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                {social.instagramUrl ? (
                  <SocialIconButton
                    href={social.instagramUrl}
                    label="Instagram"
                  >
                    <InstagramMark className="size-5" />
                  </SocialIconButton>
                ) : null}
                {social.facebookUrl ? (
                  <SocialIconButton
                    href={social.facebookUrl}
                    label="Facebook"
                  >
                    <FacebookMark className="size-5" />
                  </SocialIconButton>
                ) : null}
              </div>
            ) : null}
          </Card>
        ) : (
          <Card className="mt-10 w-full rounded-2xl border border-border bg-field p-6 text-left shadow-none">
            <div className="flex gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-[#B8862F]">
                <Heart size={18} />
              </span>
              <div>
                <h2 className="font-serif text-lg leading-[1.3] font-semibold text-deep-blue">
                  Feel generous?
                </h2>
                <p className="mt-1 text-sm leading-[1.5] text-mist">
                  No digital tips set up yet! Walk up, say hi, and leave a paper
                  tip like it&apos;s 1999.
                </p>
              </div>
            </div>

            {showSocial ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                {social.instagramUrl ? (
                  <SocialIconButton
                    href={social.instagramUrl}
                    label="Instagram"
                  >
                    <InstagramMark className="size-5" />
                  </SocialIconButton>
                ) : null}
                {social.facebookUrl ? (
                  <SocialIconButton
                    href={social.facebookUrl}
                    label="Facebook"
                  >
                    <FacebookMark className="size-5" />
                  </SocialIconButton>
                ) : null}
              </div>
            ) : null}
          </Card>
        )}

        <button
          type="button"
          onClick={resetWizard}
          className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-surface shadow-cta transition hover:bg-deep-blue active:scale-[0.98]"
        >
          <Music size={18} />
          Request Another Song
        </button>

        <Link
          href="/signup"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center text-sm text-mist transition hover:text-deep-blue"
        >
          🎤 Are you a musician? Get your free page →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-col pb-36">
      <header className="sticky top-0 z-10 overflow-hidden bg-paper px-[18px] pt-[calc(env(safe-area-inset-top)+22px)] sm:px-5">
        <div className="flex items-center justify-between gap-3 pb-3.5">
          <a
            href={`/${performer.username}`}
            className="font-serif text-lg font-semibold tracking-[-0.01em] text-deep-blue transition-opacity hover:opacity-70"
          >
            {performer.display_name}
          </a>
          <span className="text-xs font-medium text-mist">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <div
          className="grid grid-cols-5 gap-1.5 pb-3.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                index < step ? "bg-accent" : "bg-border",
                index === step - 1 &&
                  "shadow-[0_0_6px_rgba(242,183,110,0.4)]",
              )}
            />
          ))}
        </div>
      </header>

      <section key={step} className="animate-in mt-[18px] px-[18px] sm:px-5">
        {step === 1 && (
          <>
            <StepIntro
              eyebrow="Set the mood"
              title="What’s the occasion?"
              description="Pick the moment that fits right now."
            />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {occasions.map((item) => (
                <SelectionTile
                  key={item.label}
                  selected={occasion === item.label}
                  onClick={() => {
                    if (
                      occasion &&
                      occasion !== item.label &&
                      (song || requesterName.trim())
                    ) {
                      const confirmed = window.confirm(
                        "Changing the occasion will reset your song selection. Continue?",
                      );
                      if (!confirmed) return;
                      setSong(null);
                    }
                    setOccasion(item.label);
                  }}
                >
                  <span className="text-[22px] leading-none">{item.emoji}</span>
                  <span className="line-clamp-3 text-[13px] leading-[1.2] font-medium text-ink">
                    {item.label}
                  </span>
                </SelectionTile>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepIntro
              eyebrow="Choose your tune"
              title="What song are we playing?"
            />

            <div className="mt-4 grid gap-2">
              <p className="min-w-0 text-[clamp(0.98rem,4.1vw,1.1rem)] font-semibold leading-[1.35] text-deep-blue">
                Which sound like you?
              </p>

              <div className="flex flex-wrap gap-1.5">
                {availableFilters.map((filter) => {
                  const selected = genreFilter === filter;
                  const count = tagCounts[filter] ?? 0;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setGenreFilter(filter)}
                      className={cn(
                        "min-h-[28px] rounded-full border border-border bg-field px-3 py-1 text-[11px] leading-[1.1] font-normal text-ink transition-[background-color,border-color,color,box-shadow]",
                        !selected && "hover:border-border hover:bg-field",
                        selected &&
                          "border-[#e4c29b] bg-[#f3e9df] text-deep-blue shadow-[inset_0_0_0_1px_#e4c29b]",
                      )}
                    >
                      {filter}
                      <span className="ml-1 text-[10px] text-muted">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              className="mt-4 min-h-[48px] w-full rounded-full border border-border bg-field px-5 text-sm text-ink shadow-xs outline-none transition placeholder:text-muted focus:border-line-strong focus:ring-4 focus:ring-accent/25"
              placeholder="Search by song or artist..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search by song or artist"
            />

            <p className="mt-3 text-sm text-mist">
              {filteredSongs.length} song
              {filteredSongs.length === 1 ? "" : "s"}
              {genreFilter !== "All" ? ` · ${genreFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {loadingSongs ? (
                Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-field px-2 py-3.5"
                  >
                    <div className="size-6 animate-pulse rounded-full bg-border" />
                    <div className="h-3 w-16 animate-pulse rounded-full bg-border" />
                    <div className="h-2.5 w-12 animate-pulse rounded-full bg-border" />
                  </div>
                ))
              ) : (
                filteredSongs.map((item) => (
                  <SelectionTile
                    key={item.id}
                    selected={song?.id === item.id}
                    onClick={() => setSong(item)}
                    className="min-h-[92px] items-center justify-center gap-1 px-2 py-2.5 text-center"
                  >
                    <span className="text-mist">
                      <Music size={12} strokeWidth={1.75} />
                    </span>
                    <span className="w-full">
                      <span className="line-clamp-2 block text-[13px] leading-[1.3] font-semibold text-ink">
                        {item.title}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-[13px] leading-[1.3] font-medium text-[#5A7A9A]">
                        {item.artist}
                      </span>
                    </span>
                  </SelectionTile>
                ))
              )}
              {!loadingSongs && filteredSongs.length === 0 && (
                <p className="col-span-3 py-12 text-center text-[0.95rem] leading-[1.5] text-mist">
                  No songs match this search yet.
                </p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepIntro
              eyebrow="Make it personal"
              title="Who is this from?"
              description="Your name so I know who to shout out."
            />
            <Card className="mt-6 bg-surface p-6 shadow-none">
              <label
                htmlFor="requester-name"
                className="mb-3 block text-sm font-medium text-mist"
              >
                Your name
              </label>
              <Input
                id="requester-name"
                autoFocus
                autoComplete="name"
                maxLength={60}
                value={requesterName}
                onChange={(event) => setRequesterName(event.target.value)}
                placeholder="e.g. Emma"
              />
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <StepIntro
              eyebrow="One last touch"
              title="Add a dedication?"
              description="Optional short note for the mic. Keep it brief so it fits on the artist dashboard."
            />
            <Card className="mt-6 bg-surface p-6 shadow-none">
              <div className="mb-3 flex items-end justify-between gap-3">
                <label
                  htmlFor="dedication"
                  className="block text-sm font-medium text-mist"
                >
                  Dedicated to...
                </label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    dedication.length >= MAX_DEDICATION_CHARS
                      ? "font-semibold text-[#C73A2B]"
                      : "text-muted",
                  )}
                >
                  {dedication.length}/{MAX_DEDICATION_CHARS}
                </span>
              </div>
              <Input
                id="dedication"
                autoFocus
                maxLength={MAX_DEDICATION_CHARS}
                value={dedication}
                onChange={(event) =>
                  setDedication(
                    event.target.value.slice(0, MAX_DEDICATION_CHARS),
                  )
                }
                placeholder="e.g. My wonderful parents"
                disabled={submitting}
              />
              <p className="mt-2 text-xs leading-snug text-mist">
                Max {MAX_DEDICATION_CHARS} characters so the full message shows
                on the artist’s phone.
              </p>
            </Card>

            <SelectionTile
              selected={false}
              disabled={submitting}
              onClick={() => {
                setDedication("");
                void submitRequest("");
              }}
              className="mt-3 min-h-[92px] w-full gap-1 px-4 py-4"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[rgba(255,200,155,0.28)] text-deep-blue">
                <SkipForward
                  size={18}
                  strokeWidth={1.75}
                  className="text-[#B8862F]"
                />
              </span>
              <span className="text-[14px] leading-[1.2] font-medium text-ink">
                Skip dedication
              </span>
              <span className="text-[12px] leading-[1.25] text-muted">
                Send the request without a dedication.
              </span>
            </SelectionTile>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
              >
                {error}
              </p>
            )}
          </>
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom))] z-20 px-[18px]">
        <div
          className={cn(
            "pointer-events-auto mx-auto grid w-full max-w-[496px] gap-2.5 rounded-[20px] bg-paper p-3.5 shadow-dock",
            step === 1 || (step === 4 && !dedication.trim())
              ? "grid-cols-1"
              : "grid-cols-[auto_1fr]",
          )}
        >
          {step > 1 && (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="h-[52px] min-h-[52px] px-5 text-base"
              disabled={submitting}
              onClick={() => goToStep(step - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="button"
              size="lg"
              className="h-[52px] min-h-[52px] w-full"
              disabled={!canContinue}
              title={continueHint}
              onClick={() => goToStep(step + 1)}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
          ) : dedication.trim() ? (
            <Button
              type="button"
              size="lg"
              className="h-[52px] min-h-[52px] w-full"
              disabled={submitting}
              onClick={() => void submitRequest()}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Sending..." : "Submit Request"}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          ) : null}
        </div>
        {step < 4 && !canContinue && continueHint ? (
          <p className="pointer-events-none mx-auto mt-2 max-w-[496px] text-center text-xs text-mist">
            {continueHint}
          </p>
        ) : null}
      </div>
    </main>
  );
}
