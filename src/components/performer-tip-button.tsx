"use client";

import { useEffect, useId, useState } from "react";
import { ExternalLink, Heart, X } from "lucide-react";
import { TipMethodIcon } from "@/components/tip-method-icons";
import { hasTipMethods, tipMethodLinks } from "@/lib/tips";
import type { Performer } from "@/lib/types";

export function PerformerTipButton({ performer }: { performer: Performer }) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const methods = tipMethodLinks(performer);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!hasTipMethods(performer)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 text-base font-semibold text-ink transition hover:border-line-strong hover:bg-selected active:scale-[0.98]"
      >
        <Heart size={16} />
        Tip
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-4 sm:place-items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-cta"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id={dialogId}
                  className="font-serif text-xl font-semibold text-deep-blue"
                >
                  Send a tip
                </h2>
                <p className="mt-1 text-sm text-mist">
                  Support {performer.display_name}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full text-mist transition hover:bg-selected hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-2.5">
              {methods.map((method) => (
                <a
                  key={method.id}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-border bg-field px-3 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-selected"
                >
                  <span className="inline-flex items-center gap-3">
                    <TipMethodIcon id={method.id} />
                    {method.label}
                  </span>
                  <ExternalLink size={16} className="text-mist" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
