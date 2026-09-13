import { cookies } from "next/headers";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLogin } from "@/components/admin-login";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { SongRequest } from "@/lib/types";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = isValidAdminSession(
    cookieStore.get(ADMIN_COOKIE)?.value,
  );

  if (!authenticated) return <AdminLogin />;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return (
      <AdminDashboard
        initialRequests={[]}
        initialError="Add your Supabase credentials to load live requests."
      />
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .in("status", ["pending", "accepted", "played", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Initial admin requests query failed:", error);
  }

  return (
    <AdminDashboard
      initialRequests={(data as SongRequest[] | null) ?? []}
      initialError={error?.message}
    />
  );
}
