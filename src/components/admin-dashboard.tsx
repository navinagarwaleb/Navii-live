"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  LogOut,
  Music2,
  Radio,
  UserRound,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { RequestStatus, SongRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const occasionEmoji: Record<string, string> = {
  "Just Because": "🎸",
  Birthday: "🎂",
  "Date Night": "🍷",
  Anniversary: "💞",
  "Table Hype / Party Starter": "🔥",
  "Late Night Request": "🌙",
  // Legacy labels still shown for older requests
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

function sortRequests(items: SongRequest[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function formatRequestTime(value: string, mounted: boolean) {
  if (!mounted) {
    return (
      <span
        aria-hidden
        className="inline-block h-3.5 w-14 animate-pulse rounded-full bg-white/10"
      />
    );
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActiveRequestCard({
  item,
  updating,
  mounted,
  onUpdate,
}: {
  item: SongRequest;
  updating: string | null;
  mounted: boolean;
  onUpdate: (id: string, status: RequestStatus) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#292524] p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex min-h-[44px] items-center rounded-full bg-white/10 px-4 text-sm font-bold text-[#FAFAF9]">
          {occasionEmoji[item.occasion] ?? "✨"} {item.occasion}
        </span>
        <span
          className={cn(
            "inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-bold capitalize",
            statusStyles[item.status],
          )}
        >
          {item.status}
        </span>
      </div>

      <h2 className="mt-5 font-serif text-3xl leading-relaxed font-semibold tracking-[-0.02em] text-[#FAFAF9]">
        {item.song_title}
      </h2>
      <p className="mt-1 text-lg font-medium text-[#D6D3D1]">{item.artist}</p>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#1C1917] p-5 text-base leading-relaxed">
        <p className="flex items-center gap-2 text-[#FAFAF9]">
          <UserRound size={18} className="text-[#A8A29E]" />
          Requested by <strong className="font-bold">{item.requester_name}</strong>
        </p>
        {item.dedication && (
          <p className="flex items-start gap-2 text-[#FAFAF9]">
            <span className="mt-0.5 text-lg">💌</span>
            <span className="font-medium">“{item.dedication}”</span>
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-[#A8A29E]">
          <Clock3 size={16} />
          {formatRequestTime(item.created_at, mounted)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <button
          type="button"
          disabled={updating === item.id}
          onClick={() => onUpdate(item.id, "accepted")}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-sm font-bold text-[#1C1917] transition hover:bg-emerald-400 disabled:opacity-40"
        >
          <Check size={18} /> Accept
        </button>
        <button
          type="button"
          disabled={updating === item.id}
          onClick={() => onUpdate(item.id, "rejected")}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-bold text-[#FAFAF9] transition hover:bg-white/20 disabled:opacity-40"
        >
          <X size={18} /> Reject
        </button>
        <button
          type="button"
          disabled={updating === item.id}
          onClick={() => onUpdate(item.id, "played")}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FAFAF9] px-3 text-sm font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
        >
          <Music2 size={18} /> Played
        </button>
      </div>
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
    <article className="rounded-xl border border-white/5 bg-[#1C1917]/70 px-4 py-4 opacity-75">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-medium text-[#D6D3D1]">
            {item.song_title}
          </p>
          <p className="mt-0.5 truncate text-sm text-[#A8A29E]">
            {item.artist} · {item.requester_name}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize",
            statusStyles[item.status],
          )}
        >
          {item.status}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-[#78716C]">
        <Clock3 size={13} />
        {formatRequestTime(item.created_at, mounted)}
        <span className="text-[#57534E]">·</span>
        <span>
          {occasionEmoji[item.occasion] ?? "✨"} {item.occasion}
        </span>
      </p>
    </article>
  );
}

export function AdminDashboard({
  initialRequests,
  initialError = "",
}: {
  initialRequests: SongRequest[];
  initialError?: string;
}) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [requests, setRequests] = useState(() => sortRequests(initialRequests));
  const [connected, setConnected] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState(initialError);
  const [mounted, setMounted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialError) {
      console.error("Initial admin requests query failed:", initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (!supabase) return;

    let isActive = true;

    const channel = supabase
      .channel("admin-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "requests" },
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
        { event: "UPDATE", schema: "public", table: "requests" },
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
        { event: "DELETE", schema: "public", table: "requests" },
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
  }, [supabase]);

  useEffect(() => {
    if (connected) return;

    let active = true;
    async function pollRequests() {
      try {
        const response = await fetch("/api/admin/requests", {
          cache: "no-store",
        });
        const body = (await response.json()) as {
          requests?: SongRequest[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Admin polling request failed.");
        }
        if (active) {
          setRequests(sortRequests(body.requests ?? []));
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
  }, [connected]);

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
    setUpdating(id);
    setError("");
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Could not update this request.");
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
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="min-h-dvh bg-[#1C1917] text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#FAFAF9] text-[#1C1917]">
              <Music2 size={22} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#A8A29E] uppercase">
                Navii Live
              </p>
              <h1 className="font-serif text-2xl leading-relaxed font-semibold tracking-[-0.02em]">
                Stage queue
              </h1>
            </div>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={() => void logout()}
            className="grid size-11 min-h-[44px] min-w-[44px] place-items-center rounded-full border border-white/15 text-[#FAFAF9] transition hover:bg-white/10"
          >
            <LogOut size={19} />
          </button>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#292524] p-5">
            <p className="text-xs font-bold tracking-[0.14em] text-[#A8A29E] uppercase">
              Waiting
            </p>
            <p className="mt-2 font-serif text-4xl leading-none font-semibold">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#292524] p-5">
            <p className="text-xs font-bold tracking-[0.14em] text-[#A8A29E] uppercase">
              Live updates
            </p>
            <p
              className={cn(
                "mt-3 flex min-h-[44px] items-center gap-2 text-base font-bold",
                connected ? "text-emerald-300" : "text-[#A8A29E]",
              )}
            >
              <Radio size={18} className={connected ? "animate-pulse" : ""} />
              {connected ? "Connected" : "Offline"}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/15 p-4 text-sm font-semibold text-red-200"
          >
            {error}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-amber-200/80 uppercase">
                Active queue
              </p>
              <h2 className="font-serif text-xl leading-relaxed font-semibold">
                Pending requests
              </h2>
            </div>
            <span className="text-sm font-bold text-[#A8A29E]">
              {activeQueue.length}
            </span>
          </div>

          {activeQueue.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#292524] px-6 py-14 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10 text-[#A8A29E]">
                <Music2 size={24} />
              </span>
              <h3 className="mt-4 font-serif text-xl leading-relaxed font-semibold">
                Queue is clear
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A8A29E]">
                New pending requests will appear here for immediate action.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeQueue.map((item) => (
                <ActiveRequestCard
                  key={item.id}
                  item={item}
                  updating={updating}
                  mounted={mounted}
                  onUpdate={(id, status) => void updateStatus(id, status)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#292524]">
            <button
              type="button"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((open) => !open)}
              className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
            >
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#A8A29E] uppercase">
                  Completed history
                </p>
                <p className="mt-1 font-serif text-lg leading-relaxed font-semibold text-[#D6D3D1]">
                  Played & rejected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#A8A29E]">
                  {completedHistory.length}
                </span>
                <ChevronDown
                  size={20}
                  className={cn(
                    "text-[#A8A29E] transition-transform duration-200",
                    historyOpen && "rotate-180",
                  )}
                />
              </div>
            </button>

            {historyOpen && (
              <div className="border-t border-white/10 px-4 py-4">
                {completedHistory.length === 0 ? (
                  <p className="px-1 py-6 text-center text-sm leading-relaxed text-[#A8A29E]">
                    No completed requests yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
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
      </div>
    </main>
  );
}
