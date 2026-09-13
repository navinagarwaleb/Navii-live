import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

/** Deletes an auth user after a failed performers insert (orphan cleanup). */
export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string };
  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only the signed-in user can request cleanup of their own orphan account.
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Service role is not configured for account cleanup." },
      { status: 500 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete orphan auth user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
