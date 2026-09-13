"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Music2,
  Settings,
  Wallet,
} from "lucide-react";
import type { Performer } from "@/lib/types";

export function AdminOnboardingBanner({
  performer,
  siteUrl,
}: {
  performer: Performer;
  siteUrl: string;
}) {
  const pageUrl = `${siteUrl.replace(/\/$/, "")}/${performer.username}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#E4C29B]/40 bg-[#292524] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.14em] text-amber-200/80 uppercase">
        You’re live
      </p>
      <h2 className="mt-2 font-serif text-xl font-semibold text-[#FAFAF9]">
        Your page is live at /{performer.username}
      </h2>
      <p className="mt-2 text-sm text-[#A8A29E]">
        Share this link or QR so guests can request songs tonight.
      </p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-2xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for ${pageUrl}`}
            width={160}
            height={160}
            className="size-40"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="min-h-[44px] truncate rounded-full border border-white/15 px-4 text-left text-sm font-semibold text-[#FAFAF9] transition hover:bg-white/10"
          >
            {copied ? "Copied!" : pageUrl}
          </button>
          <div className="flex flex-wrap gap-2">
            <a
              href={qrSrc}
              download={`${performer.username}-qr.png`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FAFAF9] px-4 text-sm font-semibold text-[#1C1917]"
            >
              <Download size={16} />
              Download QR
            </a>
            <Link
              href={`/${performer.username}`}
              target="_blank"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-[#FAFAF9] transition hover:bg-white/10"
            >
              Open page
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminPromptCards() {
  const cards = useMemo(
    () => [
      {
        href: "/admin/songs",
        title: "Add your songs",
        body: "Build the setlist guests can request from.",
        icon: Music2,
      },
      {
        href: "/admin/settings",
        title: "Set up tips",
        body: "Add a tip handle or Interac email when you’re ready.",
        icon: Wallet,
      },
    ],
    [],
  );

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="rounded-2xl border border-white/10 bg-[#292524] p-5 transition hover:border-white/20 hover:bg-[#322f2c]"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#F2B76E]">
            <card.icon size={18} />
          </span>
          <h3 className="mt-4 font-serif text-lg font-semibold text-[#FAFAF9]">
            {card.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[#A8A29E]">{card.body}</p>
          <p className="mt-3 text-xs font-bold tracking-[0.08em] text-[#A8A29E] uppercase">
            Optional
          </p>
        </Link>
      ))}
      <Link
        href="/admin/settings"
        className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-dashed border-white/15 px-5 text-sm font-semibold text-[#A8A29E] transition hover:border-white/25 hover:text-[#FAFAF9] sm:col-span-2"
      >
        <Settings size={16} />
        Profile settings
      </Link>
    </section>
  );
}
