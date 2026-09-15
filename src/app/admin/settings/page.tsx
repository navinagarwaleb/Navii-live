"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminChangePasswordForm } from "@/components/admin-change-password-form";
import { AdminProfileForm } from "@/components/admin-profile-form";
import {
  adminDashboardHref,
  parseAdminTab,
} from "@/lib/admin-nav";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer } from "@/lib/types";

function AdminSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [performer, setPerformer] = useState<Performer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTags, setOpenTags] = useState(false);

  const fromParam = searchParams.get("from");
  const fromTab = fromParam ? parseAdminTab(fromParam) : null;
  const backHref = fromTab ? adminDashboardHref(fromTab) : "/admin";
  const backLabel =
    fromTab === "songs"
      ? "Back to songs"
      : fromTab === "sets"
        ? "Back to sets"
        : fromTab === "tips"
          ? "Back to tips"
          : fromTab === "live"
            ? "Back to live"
            : fromTab === "queue"
              ? "Back to queue"
              : "Back to dashboard";

  useEffect(() => {
    setOpenTags(window.location.hash === "#custom-tags");
  }, []);

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

  useEffect(() => {
    if (loading || !performer || !openTags) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById("custom-tags")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [loading, performer, openTags]);

  if (loading) {
    return (
      <main className="admin-shell grid min-h-dvh place-items-center bg-[#1C1917] text-[#A8A29E]">
        <Loader2 className="animate-spin" aria-label="Loading profile" />
      </main>
    );
  }

  return (
    <main className="admin-shell min-h-dvh bg-[#1C1917] text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-xl px-5 py-6 sm:px-6 sm:py-8">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
        >
          <ArrowLeft size={16} />
          {backLabel}
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
            <div className="grid gap-3">
              <AdminProfileForm
                performer={performer}
                onSaved={(next) => setPerformer(next)}
                initialOpenSection={openTags ? "tags" : null}
                backHref={backHref}
                backLabel={backLabel}
              />
              <AdminChangePasswordForm />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-shell grid min-h-dvh place-items-center bg-[#1C1917] text-[#A8A29E]">
          <Loader2 className="animate-spin" aria-label="Loading profile" />
        </main>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
