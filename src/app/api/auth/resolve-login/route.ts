import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

function looksLikeEmail(value: string) {
  return value.includes("@");
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

/** Resolve email or performer username → auth email (server-only). */
export async function resolveLoginEmail(identifier: string) {
  const raw = identifier.trim();
  if (!raw) throw new Error("Enter your email or username.");

  if (looksLikeEmail(raw)) {
    return raw.toLowerCase();
  }

  const username = normalizeUsername(raw);
  const admin = createSupabaseAdminClient();
  if (!admin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Username sign-in is not available right now.");
  }

  const { data: performer, error } = await admin
    .from("performers")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!performer?.user_id) {
    throw new Error("No account found for that username.");
  }

  const { data, error: userError } = await admin.auth.admin.getUserById(
    performer.user_id,
  );
  if (userError) throw new Error(userError.message);

  const email = data.user?.email?.trim();
  if (!email) {
    throw new Error(
      "That username is linked to a Google account. Use Sign in with Google.",
    );
  }

  return email;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { identifier?: string };
  const identifier = body.identifier?.trim() ?? "";

  try {
    const email = await resolveLoginEmail(identifier);
    return NextResponse.json({ email });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not resolve that login.",
      },
      { status: 400 },
    );
  }
}
