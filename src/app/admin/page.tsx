import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase-server";
import type { Performer, SongRequest } from "@/lib/types";

export default async function AdminPage() {
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
    .select(
      "id,username,display_name,bio,tip_handle,interac_email,user_id,created_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (performerError) {
    console.error("Unable to load performer for admin:", performerError);
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

  return (
    <AdminDashboard
      performer={performer as Performer}
      siteUrl={siteUrl}
      initialRequests={initialRequests}
      initialError={initialError}
    />
  );
}
