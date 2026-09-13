"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminChangePasswordForm } from "@/components/admin-change-password-form";
import { AdminProfileForm } from "@/components/admin-profile-form";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer } from "@/lib/types";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [performer, setPerformer] = useState<Performer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    let active = true;

    void (async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error: loadError } = await supabase
          .from("performers")
          .select(PERFORMER_SELECT_SAFE)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;

        if (loadError || !data) {
          setError(loadError?.message ?? "Could not load your profile.");
          setPerformer(null);
          return;
        }

        setPerformer(data as Performer);
        setError("");
      } catch (loadFailure) {
        if (!active) return;
        setError(
          loadFailure instanceof Error
            ? loadFailure.message
            : "Could not load your profile.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#1C1917] text-[#A8A29E]">
        <Loader2 className="animate-spin" aria-label="Loading profile" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#1C1917] text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-xl px-5 py-6 sm:px-6 sm:py-8">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="mt-6">
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
            >
              {error}
            </p>
          ) : null}
          {performer ? (
            <div className="grid gap-10">
              <AdminProfileForm
                performer={performer}
                onSaved={(next) => setPerformer(next)}
              />
              <AdminChangePasswordForm />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
