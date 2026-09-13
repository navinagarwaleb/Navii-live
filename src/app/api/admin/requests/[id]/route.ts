import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { RequestStatus } from "@/lib/types";

const allowedStatuses: RequestStatus[] = [
  "accepted",
  "rejected",
  "played",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { status } = (await request.json()) as { status?: RequestStatus };
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
