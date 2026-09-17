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
    .select("*, song:songs(artwork_url)")
    .in("status", ["pending", "accepted", "played", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Admin polling query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = (
    (data as Array<{
      artwork_url?: string | null;
      song?: { artwork_url?: string | null } | null;
      [key: string]: unknown;
    }>) ?? []
  ).map((row) => {
    const { song, ...rest } = row;
    return {
      ...rest,
      artwork_url: rest.artwork_url ?? song?.artwork_url ?? null,
    };
  });

  return NextResponse.json({ requests });
}
