"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer } from "@/lib/types";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [performer, setPerformer] = useState<Performer | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [tipHandle, setTipHandle] = useState("");
  const [interacEmail, setInteracEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("performers")
        .select(
          "id,username,display_name,bio,tip_handle,interac_email,user_id,created_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (loadError || !data) {
        setError(loadError?.message ?? "Could not load your profile.");
        setLoading(false);
        return;
      }

      const row = data as Performer;
      setPerformer(row);
      setDisplayName(row.display_name ?? "");
      setBio(row.bio ?? "");
      setTipHandle(row.tip_handle ?? "");
      setInteracEmail(row.interac_email ?? "");
      setLoading(false);
    })();
  }, [router]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!performer) return;
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("performers")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        tip_handle: tipHandle.trim() || null,
        interac_email: interacEmail.trim() || null,
      })
      .eq("id", performer.id);

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Profile saved.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#1C1917] text-[#A8A29E]">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#1C1917] text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-xl px-5 py-6 sm:px-6 sm:py-8">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <h1 className="mt-6 font-serif text-3xl font-semibold tracking-[-0.02em]">
          Profile settings
        </h1>
        <p className="mt-2 text-sm text-[#A8A29E]">
          Tips and Interac are optional — set them whenever you’re ready.
        </p>

        <form onSubmit={(event) => void onSave(event)} className="mt-8 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              Display name
            </label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="border-white/15 bg-[#292524] text-[#FAFAF9]"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              Bio / tagline
            </label>
            <Input
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="border-white/15 bg-[#292524] text-[#FAFAF9]"
              placeholder="Request a song and make your moment unforgettable."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              Tip handle
            </label>
            <Input
              value={tipHandle}
              onChange={(event) => setTipHandle(event.target.value)}
              className="border-white/15 bg-[#292524] text-[#FAFAF9]"
              placeholder="Buy Me a Coffee or tip username"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              Interac email
            </label>
            <Input
              type="email"
              value={interacEmail}
              onChange={(event) => setInteracEmail(event.target.value)}
              className="border-white/15 bg-[#292524] text-[#FAFAF9]"
              placeholder="tips@youremail.com"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="min-h-[48px] w-full bg-[#FAFAF9] text-[#1C1917] hover:bg-white"
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save settings
          </Button>
        </form>
      </div>
    </main>
  );
}
