"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CircleCheckBig,
  ExternalLink,
  Heart,
  Loader2,
  Music,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Song, SongRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;

/** Preferred chip order when present; any other Supabase tags still appear after. */
const PREFERRED_TAG_ORDER = [
  "Sing-Alongs",
  "Classic Rock",
  "Pub Anthems",
  "Crowd Favourites",
  "Romantic & Slow",
  "Late Night Vibe",
  "New / Fresh",
] as const;

const occasions = [
  { emoji: "🎸", label: "Just Because" },
  { emoji: "🎉", label: "Shoutout / Birthday" },
  { emoji: "🍷", label: "Table Dedication / Date Night" },
  { emoji: "🍻", label: "Round of Cheers / Table Anthem" },
  { emoji: "🔥", label: "Table Hype / Party Starter" },
  { emoji: "🌙", label: "Late Night Request" },
];

const demoSongs: Song[] = [
  {
    id: "demo-1",
    title: "Perfect",
    artist: "Ed Sheeran",
    tags: ["Romantic & Slow", "Sing-Alongs"],
  },
  {
    id: "demo-2",
    title: "Until I Found You",
    artist: "Stephen Sanchez",
    tags: ["Romantic & Slow"],
  },
  {
    id: "demo-3",
    title: "A Thousand Years",
    artist: "Christina Perri",
    tags: ["Sing-Alongs", "Romantic & Slow"],
  },
  {
    id: "demo-4",
    title: "Can’t Help Falling in Love",
    artist: "Elvis Presley",
    tags: ["Classic Rock", "Sing-Alongs"],
  },
  {
    id: "demo-5",
    title: "Yellow",
    artist: "Coldplay",
    tags: ["Sing-Alongs", "Crowd Favourites"],
  },
  {
    id: "demo-6",
    title: "You Are the Reason",
    artist: "Calum Scott",
    tags: ["Romantic & Slow"],
  },
  {
    id: "demo-7",
    title: "All of Me",
    artist: "John Legend",
    tags: ["Sing-Alongs", "Romantic & Slow"],
  },
  {
    id: "demo-8",
    title: "Lover",
    artist: "Taylor Swift",
    tags: ["Sing-Alongs", "New / Fresh"],
  },
  {
    id: "demo-9",
    title: "I Won’t Give Up",
    artist: "Jason Mraz",
    tags: ["Late Night Vibe"],
  },
  {
    id: "demo-10",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    tags: ["Pub Anthems", "Sing-Alongs"],
  },
];

function SelectionTile({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex min-h-[96px] touch-manipulation flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-[1.5px] border-border bg-field px-2 py-3.5 text-center shadow-xs transition-all outline-none",
        "hover:border-line-strong hover:bg-selected focus-visible:ring-4 focus-visible:ring-accent/30 active:scale-[0.97]",
        selected && "border-line-strong bg-selected shadow-none",
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

export function RequestWizard() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [song, setSong] = useState<Song | null>(null);
  const [genreFilter, setGenreFilter] = useState("All");
  const [requesterName, setRequesterName] = useState("");
  const [dedication, setDedication] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] =
    useState<SongRequest | null>(null);
  const [error, setError] = useState("");

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
        .select("id,title,artist,active,tags")
        .eq("active", true)
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
  }, [supabase]);

  useEffect(() => {
    if (step !== 5) return;

    const end = Date.now() + 1800;
    const colors = ["#0D1B2E", "#F2B76E", "#FFC89B", "#F7F4F0"];
    const timer = window.setInterval(() => {
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

    return () => window.clearInterval(timer);
  }, [step]);

  const filteredSongs = useMemo(() => {
    if (genreFilter === "All") return songs;
    return songs.filter((item) =>
      (item.tags ?? []).some(
        (tag) => tag.toLowerCase() === genreFilter.toLowerCase(),
      ),
    );
  }, [genreFilter, songs]);

  const availableFilters = useMemo(() => {
    const present = new Set(
      songs.flatMap((item) =>
        (item.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      ),
    );

    const preferred = PREFERRED_TAG_ORDER.filter((tag) => present.has(tag));
    const extras = [...present]
      .filter((tag) => !PREFERRED_TAG_ORDER.includes(tag as (typeof PREFERRED_TAG_ORDER)[number]))
      .sort((a, b) => a.localeCompare(b));

    return ["All", ...preferred, ...extras];
  }, [songs]);

  const canContinue =
    (step === 1 && occasion) ||
    (step === 2 && song) ||
    (step === 3 && requesterName.trim());

  async function submitRequest(dedicationOverride?: string) {
    if (!song || !occasion || !requesterName.trim()) return;

    setSubmitting(true);
    setError("");
    const dedicationValue = dedicationOverride ?? dedication;
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
    setStep(5);
  }

  if (step === 5) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-col flex-col items-center justify-center px-6 py-10 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-surface text-[#B8862F] shadow-soft">
          <CircleCheckBig size={30} />
        </div>
        <Badge className="mt-6">Request received</Badge>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,6vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Your song is in the queue!
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Navii has your request for{" "}
          <strong className="font-semibold text-ink">
            {submittedRequest?.song_title ?? song?.title}
          </strong>
          . Listen out for your moment.
        </p>

        <Card className="mt-10 w-full p-6 text-left">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-[#B8862F]">
              <Heart size={18} />
            </span>
            <div>
              <h2 className="font-serif text-lg leading-[1.3] font-semibold text-deep-blue">
                Show some love
              </h2>
              <p className="mt-1 text-sm leading-[1.5] text-mist">
                Follow the music, share your night, or leave a little tip.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <a
              href="https://instagram.com/navii.live"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[52px] items-center justify-between rounded-full border border-border bg-surface px-5 text-sm font-semibold text-ink"
            >
              <span className="flex items-center gap-2">
                <AtSign size={16} /> @navii.live
              </span>
              <ExternalLink size={15} />
            </a>
            <a
              href="https://www.buymeacoffee.com/navii.live"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[52px] items-center justify-between rounded-full bg-ink px-5 text-sm font-semibold text-surface shadow-cta"
            >
              Tip jar <ExternalLink size={15} />
            </a>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-col pb-36">
      <header className="sticky top-0 z-10 overflow-hidden bg-paper px-[18px] pt-[calc(env(safe-area-inset-top)+22px)] sm:px-5">
        <div className="flex items-center justify-between gap-3 pb-3.5">
          <p className="font-serif text-lg font-semibold tracking-[-0.01em] text-deep-blue">
            Navii Live
          </p>
          <span className="text-xs font-medium text-mist">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <div
          className="grid grid-cols-5 gap-1.5 pb-3.5"
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                index < step ? "bg-accent" : "bg-border",
              )}
            />
          ))}
        </div>
      </header>

      <section className="mt-[18px] px-[18px] sm:px-5">
        {step === 1 && (
          <>
            <StepIntro
              eyebrow="Set the mood"
              title="What’s the vibe?"
              description="Pick the social intent that fits your moment."
            />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {occasions.map((item) => (
                <SelectionTile
                  key={item.label}
                  selected={occasion === item.label}
                  onClick={() => setOccasion(item.label)}
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
              title="Which song should Navii play?"
            />

            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-[clamp(0.98rem,4.1vw,1.1rem)] font-semibold leading-[1.35] text-deep-blue">
                  Which sound like you?
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(255,200,155,0.55)] bg-surface px-3.5 py-[7px] text-[0.85rem] leading-none font-semibold whitespace-nowrap text-[#B8862F]">
                  <Sparkles size={12} strokeWidth={2} className="text-accent" />
                  More ideas
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableFilters.map((filter) => {
                  const selected = genreFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setGenreFilter(filter)}
                      className={cn(
                        "rounded-full border border-border bg-field px-[18px] py-2 text-[13px] leading-[1.1] font-normal text-ink transition-[background-color,border-color,color,box-shadow]",
                        !selected && "hover:border-border hover:bg-field",
                        selected &&
                          "border-[#e4c29b] bg-[#f3e9df] text-deep-blue shadow-[inset_0_0_0_1px_#e4c29b]",
                      )}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {loadingSongs ? (
                <div className="col-span-3 grid min-h-[44px] place-items-center py-16 text-mist">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                filteredSongs.map((item) => (
                  <SelectionTile
                    key={item.id}
                    selected={song?.id === item.id}
                    onClick={() => setSong(item)}
                    className="min-h-[88px] items-center justify-center gap-1 px-2 py-2.5 text-center"
                  >
                    <span className="text-mist">
                      <Music size={12} strokeWidth={1.75} />
                    </span>
                    <span className="w-full">
                      <span className="line-clamp-2 block text-[12px] leading-[1.2] font-medium text-ink">
                        {item.title}
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-[11px] leading-[1.25] text-muted">
                        {item.artist}
                      </span>
                    </span>
                  </SelectionTile>
                ))
              )}
              {!loadingSongs && filteredSongs.length === 0 && (
                <p className="col-span-3 py-12 text-center text-[0.95rem] leading-[1.5] text-mist">
                  No songs match this genre yet.
                </p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepIntro
              eyebrow="Make it personal"
              title="Who’s making the request?"
              description="This helps Navii give you a proper shout-out."
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
              title="Who is this dedicated to?"
              description="Add their name or a short message for Navii to share."
            />
            <Card className="mt-6 bg-surface p-6 shadow-none">
              <label
                htmlFor="dedication"
                className="mb-3 block text-sm font-medium text-mist"
              >
                Dedicated to...
              </label>
              <Input
                id="dedication"
                autoFocus
                maxLength={120}
                value={dedication}
                onChange={(event) => setDedication(event.target.value)}
                placeholder="e.g. My wonderful parents"
              />
            </Card>

            <SelectionTile
              selected={false}
              onClick={() => {
                if (submitting) return;
                setDedication("");
                void submitRequest("");
              }}
              className="mt-3 min-h-[88px] w-full gap-1 px-4 py-4"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[rgba(255,200,155,0.28)] text-deep-blue">
                <SkipForward size={18} strokeWidth={1.75} className="text-[#B8862F]" />
              </span>
              <span className="text-[14px] leading-[1.2] font-medium text-ink">
                Skip dedication
              </span>
              <span className="text-[12px] leading-[1.25] text-muted">
                Just send the song request as is
              </span>
            </SelectionTile>

            {error && (
              <p
                role="alert"
                className="mt-4 text-sm font-semibold text-[#9D5440]"
              >
                {error}
              </p>
            )}
          </>
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom))] z-20 px-[18px]">
        <div className="pointer-events-auto mx-auto grid w-full max-w-[496px] grid-cols-[auto_1fr] gap-2.5 rounded-[20px] bg-paper p-3.5 shadow-dock">
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="h-[52px] min-h-[52px] px-5 text-base"
            disabled={submitting}
            onClick={() =>
              step === 1 ? window.history.back() : setStep(step - 1)
            }
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              size="lg"
              className="h-[52px] min-h-[52px] w-full"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
          ) : (
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
          )}
        </div>
      </div>
    </main>
  );
}
