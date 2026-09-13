"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LandingCtas() {
  const [performerPath, setPerformerPath] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    let active = true;

    async function loadPerformerLink() {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active || !session?.user) {
        if (active) setPerformerPath(null);
        return;
      }

      const { data } = await client
        .from("performers")
        .select("username")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;
      setPerformerPath(data?.username ? `/${data.username}` : null);
    }

    void loadPerformerLink();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void loadPerformerLink();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="animate-rise rise-4 mt-8 grid gap-3">
      <Link
        href="/signup"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-surface shadow-cta transition hover:bg-deep-blue active:scale-[0.98]"
      >
        Get your free page
        <ArrowRight size={16} />
      </Link>

      {performerPath ? (
        <Link
          href={performerPath}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border bg-transparent px-6 text-base font-semibold text-ink transition hover:border-line-strong hover:bg-selected active:scale-[0.98]"
        >
          Request a song
        </Link>
      ) : null}
    </div>
  );
}
