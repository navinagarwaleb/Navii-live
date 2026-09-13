import { NextResponse } from "next/server";

/** Safe env check for production debugging. No secrets returned. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return NextResponse.json({
    hasSupabaseUrl: Boolean(url),
    hasSupabaseAnonKey: Boolean(anon),
    supabaseHost: url ? new URL(url).host : null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    configured: Boolean(url && anon),
  });
}
