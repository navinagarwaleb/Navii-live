import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .in("status", ["pending", "accepted", "played", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Admin polling query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
