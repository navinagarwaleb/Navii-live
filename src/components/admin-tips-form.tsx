"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FacebookMark,
  InstagramMark,
  SocialIconButton,
} from "@/components/tip-method-icons";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import { getSocialLinks } from "@/lib/social";
import {
  normalizeCashAppHandle,
  normalizePaypalMeLink,
  normalizeVenmoHandle,
} from "@/lib/tips";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer } from "@/lib/types";

export function AdminTipsForm({
  performer,
  onSaved,
}: {
  performer: Performer;
  onSaved?: (next: Performer) => void;
}) {
  const social = getSocialLinks(performer);
  const [paypalMeLink, setPaypalMeLink] = useState(
    performer.paypal_me_link ?? performer.paypal_link ?? "",
  );
  const [venmoHandle, setVenmoHandle] = useState(
    performer.venmo_handle
      ? performer.venmo_handle.startsWith("@")
        ? performer.venmo_handle
        : `@${performer.venmo_handle}`
      : "",
  );
  const [cashAppHandle, setCashAppHandle] = useState(
    performer.cash_app_handle ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setSaving(false);
      return;
    }

    const paypal = normalizePaypalMeLink(paypalMeLink);
    const venmo = normalizeVenmoHandle(venmoHandle);
    const cashApp = normalizeCashAppHandle(cashAppHandle);

    const { data, error: saveError } = await supabase
      .from("performers")
      .update({
        paypal_me_link: paypal,
        venmo_handle: venmo,
        cash_app_handle: cashApp,
      })
      .eq("id", performer.id)
      .select(PERFORMER_SELECT_SAFE)
      .single();

    if (saveError) {
      setError(
        /paypal_me_link|venmo_handle|cash_app_handle|column .* does not exist|Could not find/i.test(
          saveError.message ?? "",
        )
          ? "Tip columns are missing in Supabase. Run migration 20260913_performers_p2p_tips.sql in the SQL editor, then try again."
          : (saveError.message ?? "Could not save tips."),
      );
    } else {
      setPaypalMeLink(paypal ?? "");
      setVenmoHandle(venmo ? `@${venmo}` : "");
      setCashAppHandle(cashApp ?? "");
      setMessage("Tips saved.");
      if (data && onSaved) onSaved(data as Performer);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={(event) => void onSave(event)} className="grid gap-5">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#FAFAF9]">
          Tips
        </h2>
        <p className="mt-1 text-sm text-[#A8A29E]">
          Optional. Add the tip jars you accept. Guests only see what you fill
          in.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#292524] p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#A8A29E] sm:text-sm">
              PayPal.Me
            </label>
            <Input
              value={paypalMeLink}
              onChange={(event) => setPaypalMeLink(event.target.value)}
              className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
              placeholder="paypal.me/you"
              inputMode="url"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[#A8A29E] sm:text-sm">
              Venmo
            </label>
            <Input
              value={venmoHandle}
              onChange={(event) => setVenmoHandle(event.target.value)}
              className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
              placeholder="@yourname"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[#A8A29E] sm:text-sm">
              Cash App
            </label>
            <Input
              value={cashAppHandle}
              onChange={(event) => setCashAppHandle(event.target.value)}
              className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
              placeholder="$yourname"
              autoComplete="off"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-[#A8A29E]">
          PayPal.Me works best as a full link so fans can tip with Apple Pay or
          a card.
        </p>
      </div>

      {social.instagramUrl || social.facebookUrl ? (
        <div>
          <p className="mb-2 text-sm font-medium text-[#A8A29E]">
            From your profile
          </p>
          <div className="flex items-center gap-2">
            {social.instagramUrl ? (
              <SocialIconButton
                href={social.instagramUrl}
                label="Instagram"
                tone="dark"
              >
                <InstagramMark className="size-5" />
              </SocialIconButton>
            ) : null}
            {social.facebookUrl ? (
              <SocialIconButton
                href={social.facebookUrl}
                label="Facebook"
                tone="dark"
              >
                <FacebookMark className="size-5" />
              </SocialIconButton>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-[#A8A29E]">
            Edit Instagram and Facebook in Profile settings.
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#A8A29E]">
          Add Instagram or Facebook in{" "}
          <a
            href="/admin/settings"
            className="font-semibold text-[#FAFAF9] underline-offset-2 hover:underline"
          >
            Profile settings
          </a>{" "}
          to show follow icons here.
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
        >
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
        Save
      </Button>
    </form>
  );
}
