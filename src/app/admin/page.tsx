import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase-server";
import type { Performer, SongRequest } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?error=config");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: performer, error: performerError } = await supabase
    .from("performers")
    .select(PERFORMER_SELECT_SAFE)
    .eq("user_id", user.id)
    .maybeSingle();

  if (performerError) {
    console.error(
      "Unable to load performer for admin:",
      performerError.message ?? JSON.stringify(performerError),
    );
  }

  if (!performer) {
    redirect("/setup");
  }

  const admin = createSupabaseAdminClient();
  let initialRequests: SongRequest[] = [];
  let initialError = "";

  if (admin) {
    const { data, error } = await admin
      .from("requests")
      .select("*")
      .eq("performer_id", performer.id)
      .in("status", ["pending", "accepted", "played", "rejected"])
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Initial admin requests query failed:", error);
      initialError = error.message;
    } else {
      initialRequests = (data as SongRequest[]) ?? [];
    }
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (host ? `${proto}://${host}` : "http://localhost:3000");

  const tab =
    params.tab === "live" || params.tab === "songs" || params.tab === "tips"
      ? params.tab
      : "queue";

  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[#1C1917] text-[#A8A29E]">
          Loading…
        </main>
      }
    >
      <AdminDashboard
        performer={performer as Performer}
        siteUrl={siteUrl}
        initialRequests={initialRequests}
        initialError={initialError}
        initialTab={tab}
      />
    </Suspense>
  );
}
