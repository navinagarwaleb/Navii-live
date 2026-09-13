import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: performer } = await supabase
          .from("performers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!performer) {
          return NextResponse.redirect(`${origin}/setup`);
        }

        return NextResponse.redirect(`${origin}/admin`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
