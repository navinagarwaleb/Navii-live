"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  Heart,
  ListMusic,
  LogOut,
  Music2,
  QrCode,
  Radio,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminOnboardingBanner } from "@/components/admin-onboarding";
import { AdminSetlists } from "@/components/admin-setlists";
import { AdminSongEditor } from "@/components/admin-song-editor";
import { AdminTipsForm } from "@/components/admin-tips-form";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer, RequestStatus, SongRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const occasionEmoji: Record<string, string> = {
  "Just Because": "🎸",
  Birthday: "🎂",
  "Date Night": "🍷",
  Anniversary: "💞",
  "Table Hype / Party Starter": "🔥",
  "Late Night Request": "🌙",
  "Shoutout / Birthday": "🎉",
  "Table Dedication / Date Night": "🍷",
  "Round of Cheers / Table Anthem": "🍻",
};

const statusStyles: Record<RequestStatus, string> = {
  pending: "bg-amber-400/20 text-amber-200",
  accepted: "bg-emerald-400/20 text-emerald-200",
  rejected: "bg-white/10 text-[#A8A29E]",
  played: "bg-violet-400/20 text-violet-200",
};

type AdminTab = "queue" | "live" | "songs" | "sets" | "tips";

const TABS: { id: AdminTab; label: string; icon: typeof Music2 }[] = [
  { id: "queue", label: "Queue", icon: Radio },
  { id: "live", label: "Live", icon: QrCode },
  { id: "songs", label: "Songs", icon: Music2 },
  { id: "sets", label: "Sets", icon: ListMusic },
  { id: "tips", label: "Tips", icon: Wallet },
];

function parseTab(value: string | null): AdminTab {
  if (
    value === "live" ||
    value === "songs" ||
    value === "sets" ||
    value === "tips"
  ) {
    return value;
  }
  return "queue";
}

function sortRequests(items: SongRequest[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function formatRequestTime(value: string, mounted: boolean) {
  if (!mounted) {
    return (
      <span
        aria-hidden
        className="inline-block h-3.5 w-28 animate-pulse rounded-full bg-white/10"
      />
    );
  }

  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()] ?? "JAN";
  const year = date.getFullYear();
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day}-${month}-${year} · ${time}`;
}

function ActiveRequestCard({
  item,
  updating,
  mounted,
  expanded,
  onToggle,
  onUpdate,
}: {
  item: SongRequest;
  updating: string | null;
  mounted: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, status: RequestStatus) => void;
}) {
  return (
    <article className="bg-[#292524]">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-2.5 py-1.5 text-left transition hover:bg-white/5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
          <Music2 size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
            {item.song_title}
          </p>
          <p className="truncate text-xs leading-snug text-[#A8A29E]">
            {item.artist}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
            statusStyles[item.status],
          )}
        >
          {item.status}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "shrink-0 text-[#A8A29E] transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="space-y-2.5 border-t border-white/5 px-2.5 pt-2 pb-2.5">
          <div className="grid gap-1 text-sm text-[#D6D3D1]">
            <p className="flex items-center gap-2">
              <UserRound size={13} className="shrink-0 text-[#A8A29E]" />
              <span>
                <span className="text-[#A8A29E]">From </span>
                <strong className="font-semibold text-[#FAFAF9]">
                  {item.requester_name}
                </strong>
              </span>
            </p>
            {item.dedication ? (
              <p className="flex items-start gap-2 text-[13px] leading-snug">
                <Heart size={13} className="mt-0.5 shrink-0 text-[#A8A29E]" />
                <span className="break-words whitespace-normal">
                  <span className="text-[#A8A29E]">Dedication </span>
                  <span className="text-[#D6D3D1]">“{item.dedication}”</span>
                </span>
              </p>
            ) : null}
            <p className="flex items-center gap-2 text-xs text-[#A8A29E]">
              <Clock3 size={12} className="shrink-0" />
              {formatRequestTime(item.created_at, mounted)}
              <span className="text-[#57534E]">·</span>
              <span>
                {occasionEmoji[item.occasion] ?? "✨"} {item.occasion}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={updating === item.id}
              onClick={() => onUpdate(item.id, "accepted")}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 text-xs font-bold text-[#1C1917] transition hover:bg-emerald-400 disabled:opacity-40"
            >
              <Check size={13} /> Accept
            </button>
            <button
              type="button"
              disabled={updating === item.id}
              onClick={() => onUpdate(item.id, "rejected")}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-white/15 px-2 text-xs font-bold text-[#FAFAF9] transition hover:bg-white/20 disabled:opacity-40"
            >
              <X size={13} /> Reject
            </button>
            <button
              type="button"
              disabled={updating === item.id}
              onClick={() => onUpdate(item.id, "played")}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-[#FAFAF9] px-2 text-xs font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
            >
              <Music2 size={13} /> Played
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function HistoryRequestRow({
  item,
  mounted,
}: {
  item: SongRequest;
  mounted: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-1.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
        <Music2 size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
          {item.song_title}
        </p>
        <p className="truncate text-xs leading-snug text-[#A8A29E]">
          {item.artist} · {item.requester_name} ·{" "}
          {formatRequestTime(item.created_at, mounted)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
          statusStyles[item.status],
        )}
      >
        {item.status}
      </span>
    </div>
  );
}

export function AdminDashboard({
  performer: initialPerformer,
  siteUrl,
  initialRequests,
  initialError = "",
  initialTab = "queue",
}: {
  performer: Performer;
  siteUrl: string;
  initialRequests: SongRequest[];
  initialError?: string;
  initialTab?: AdminTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [performer, setPerformer] = useState(initialPerformer);
  const [tab, setTab] = useState<AdminTab>(() =>
    parseTab(searchParams.get("tab") ?? initialTab),
  );
  const [requests, setRequests] = useState(() =>
    sortRequests(
      initialRequests.filter((item) => item.performer_id === performer.id),
    ),
  );
  const [connected, setConnected] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState(initialError);
  const [mounted, setMounted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab") ?? initialTab));
  }, [searchParams, initialTab]);

  function selectTab(next: AdminTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "queue") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/admin?${query}` : "/admin", { scroll: false });
  }

  useEffect(() => {
    if (initialError) {
      console.error("Initial admin requests query failed:", initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (!supabase) return;

    let isActive = true;

    const channel = supabase
      .channel(`admin-requests-${performer.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
          filter: `performer_id=eq.${performer.id}`,
        },
        (payload) => {
          const incoming = payload.new as SongRequest;
          setRequests((current) => [
            incoming,
            ...current.filter((item) => item.id !== incoming.id),
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `performer_id=eq.${performer.id}`,
        },
        (payload) => {
          const incoming = payload.new as SongRequest;
          setRequests((current) =>
            sortRequests([
              incoming,
              ...current.filter((item) => item.id !== incoming.id),
            ]),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "requests",
          filter: `performer_id=eq.${performer.id}`,
        },
        (payload) => {
          const deleted = payload.old as Pick<SongRequest, "id">;
          setRequests((current) =>
            current.filter((item) => item.id !== deleted.id),
          );
        },
      )
      .subscribe((status) => {
        if (!isActive) return;

        if (status === "SUBSCRIBED") {
          setConnected(true);
          return;
        }

        setConnected(false);

        if (status === "CLOSED") {
          console.info("Supabase Realtime channel closed");
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`Supabase Realtime connection ${status.toLowerCase()}`);
        }
      });

    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, performer.id]);

  useEffect(() => {
    if (connected || !supabase) return;

    const client = supabase;
    let active = true;
    async function pollRequests() {
      try {
        const { data, error: pollError } = await client
          .from("requests")
          .select("*")
          .eq("performer_id", performer.id)
          .in("status", ["pending", "accepted", "played", "rejected"])
          .order("created_at", { ascending: false })
          .limit(1000);

        if (pollError) throw pollError;
        if (active) {
          setRequests(sortRequests((data as SongRequest[]) ?? []));
        }
      } catch (pollError) {
        console.error("Admin polling fallback failed:", pollError);
      }
    }

    void pollRequests();
    const interval = window.setInterval(() => void pollRequests(), 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [connected, supabase, performer.id]);

  const activeQueue = useMemo(
    () =>
      sortRequests(
        requests.filter(
          (item) => item.status === "pending" || item.status === "accepted",
        ),
      ),
    [requests],
  );

  const completedHistory = useMemo(
    () =>
      sortRequests(
        requests.filter(
          (item) => item.status === "played" || item.status === "rejected",
        ),
      ),
    [requests],
  );

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending").length,
    [requests],
  );

  async function updateStatus(id: string, status: RequestStatus) {
    if (!supabase) return;
    setUpdating(id);
    setError("");

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id)
      .eq("performer_id", performer.id);

    if (updateError) {
      setError(updateError.message || "Could not update this request.");
    } else {
      setRequests((current) =>
        sortRequests(
          current.map((item) => (item.id === id ? { ...item, status } : item)),
        ),
      );
    }
    setUpdating(null);
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="admin-shell min-h-dvh bg-[#1C1917] text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FAFAF9] text-[#1C1917]">
              <Music2 size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold tracking-[0.14em] text-[#A8A29E] uppercase">
                {performer.display_name}
              </p>
              <h1 className="font-serif text-xl leading-tight font-semibold tracking-[-0.02em]">
                Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="grid size-11 min-h-[44px] min-w-[44px] place-items-center rounded-full border border-white/15 text-[#FAFAF9] transition hover:bg-white/10"
              aria-label="Profile settings"
            >
              <UserRound size={19} />
            </Link>
            <button
              type="button"
              aria-label="Log out"
              onClick={() => void logout()}
              className="grid size-11 min-h-[44px] min-w-[44px] place-items-center rounded-full border border-white/15 text-[#FAFAF9] transition hover:bg-white/10"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <nav
          aria-label="Admin sections"
          className="mt-4 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#292524] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={cn(
                "inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap transition sm:gap-1.5 sm:px-3 sm:text-sm",
                tab === item.id
                  ? "bg-[#FAFAF9] text-[#1C1917]"
                  : "text-[#A8A29E] hover:text-[#FAFAF9]",
              )}
            >
              <item.icon size={15} />
              {item.label}
              {item.id === "queue" && pendingCount > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold",
                    tab === item.id
                      ? "bg-[#1C1917]/10 text-[#1C1917]"
                      : "bg-amber-400/20 text-amber-200",
                  )}
                >
                  {pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {tab === "queue" ? (
          <>
            <section className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#292524] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Waiting
                </p>
                <p className="font-serif text-2xl leading-none font-semibold tabular-nums">
                  {pendingCount}
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Live updates
                </p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-1.5 text-sm font-semibold",
                    connected ? "text-emerald-300" : "text-[#A8A29E]",
                  )}
                >
                  <Radio
                    size={14}
                    className={connected ? "animate-pulse" : ""}
                  />
                  {connected ? "Live" : "Offline"}
                </p>
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2.5 text-sm font-semibold text-red-200"
              >
                {error}
              </div>
            )}

            <section className="mt-5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#FAFAF9]">
                  Pending requests
                </h2>
                <span className="text-xs font-bold text-[#A8A29E]">
                  {activeQueue.length}
                </span>
              </div>

              {activeQueue.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#292524] px-4 py-8 text-center">
                  <Music2 size={20} className="mx-auto text-[#A8A29E]" />
                  <p className="mt-2 text-sm font-semibold text-[#FAFAF9]">
                    Queue is clear
                  </p>
                  <p className="mt-1 text-xs text-[#A8A29E]">
                    Share /{performer.username} for new requests.
                  </p>
                  <button
                    type="button"
                    onClick={() => selectTab("live")}
                    className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-[#FAFAF9] transition hover:bg-white/10"
                  >
                    <QrCode size={14} />
                    Get QR & link
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 divide-y divide-white/5">
                  {activeQueue.map((item) => (
                    <ActiveRequestCard
                      key={item.id}
                      item={item}
                      updating={updating}
                      mounted={mounted}
                      expanded={expandedId === item.id}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                      onUpdate={(id, status) => void updateStatus(id, status)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-5">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#292524]">
                <button
                  type="button"
                  aria-expanded={historyOpen}
                  onClick={() => setHistoryOpen((open) => !open)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5"
                >
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                      History
                    </p>
                    <p className="text-sm font-semibold text-[#D6D3D1]">
                      Played & rejected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-[#A8A29E]">
                      {completedHistory.length}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-[#A8A29E] transition-transform duration-200",
                        historyOpen && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {historyOpen && (
                  <div className="border-t border-white/10">
                    {completedHistory.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-[#A8A29E]">
                        No completed requests yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {completedHistory.map((item) => (
                          <HistoryRequestRow
                            key={item.id}
                            item={item}
                            mounted={mounted}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "live" ? (
          <div className="mt-6">
            <AdminOnboardingBanner performer={performer} siteUrl={siteUrl} />
          </div>
        ) : null}

        {tab === "songs" ? (
          <div className="mt-6">
            <AdminSongEditor performer={performer} />
          </div>
        ) : null}

        {tab === "sets" ? (
          <div className="mt-6">
            <AdminSetlists performer={performer} />
          </div>
        ) : null}

        {tab === "tips" ? (
          <div className="mt-6">
            <AdminTipsForm
              performer={performer}
              onSaved={(next) => setPerformer(next)}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
