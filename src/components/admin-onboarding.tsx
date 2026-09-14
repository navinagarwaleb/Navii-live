"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
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
        <div className="mx-auto w-fit shrink-0 self-start rounded-2xl bg-white p-3 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for ${pageUrl}`}
            width={160}
            height={160}
            className="block size-40"
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
