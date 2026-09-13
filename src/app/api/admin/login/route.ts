import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { pin?: string };
  const password = process.env.ADMIN_PASSWORD;
  const token = adminSessionToken();

  if (!password || !token) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 503 },
    );
  }

  if (body.pin !== password) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
