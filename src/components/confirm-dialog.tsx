"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional third action (e.g. “Don’t save”). Shown instead of cancel when set. */
  secondaryLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  /** Admin dashboard chrome vs guest paper surfaces. */
  surface?: "admin" | "paper";
  onConfirm: () => void;
  onCancel: () => void;
  onSecondary?: () => void;
};

/**
 * In-app confirm modal. Never use window.confirm / alert / prompt.
 * Match create/edit song portals: overlay + rounded card + pill actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  secondaryLabel,
  tone = "default",
  busy = false,
  surface = "admin",
  onConfirm,
  onCancel,
  onSecondary,
}: ConfirmDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open || !mounted) return null;

  const isAdmin = surface === "admin";
  const leftLabel = secondaryLabel ?? cancelLabel;
  const onLeft = secondaryLabel ? (onSecondary ?? onCancel) : onCancel;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[110] grid place-items-center p-4",
        isAdmin ? "bg-black/55" : "bg-ink/45",
      )}
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "w-full max-w-md p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          isAdmin
            ? "rounded-2xl border border-white/15 bg-[#1C1917]"
            : "rounded-3xl border border-border bg-surface shadow-cta",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              id={titleId}
              className={cn(
                "font-serif text-lg font-semibold",
                isAdmin ? "text-[#FAFAF9]" : "text-deep-blue",
              )}
            >
              {title}
            </p>
            {description ? (
              <div
                className={cn(
                  "mt-1 text-sm leading-relaxed",
                  isAdmin ? "text-[#A8A29E]" : "text-mist",
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onCancel}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full transition disabled:opacity-40",
              isAdmin
                ? "text-[#A8A29E] hover:bg-white/10 hover:text-[#FAFAF9]"
                : "text-mist hover:bg-selected hover:text-ink",
            )}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onLeft}
            className={cn(
              "min-h-[44px] rounded-full text-sm font-semibold transition disabled:opacity-40",
              isAdmin
                ? "border border-white/15 text-[#FAFAF9] hover:bg-white/5"
                : "border border-border text-ink hover:bg-selected",
            )}
          >
            {leftLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-bold transition disabled:opacity-40",
              tone === "danger"
                ? isAdmin
                  ? "bg-red-500/90 text-[#FAFAF9] hover:bg-red-500"
                  : "bg-red-600 text-white hover:bg-red-700"
                : isAdmin
                  ? "bg-[#FAFAF9] text-[#1C1917] hover:bg-white"
                  : "bg-ink text-paper hover:opacity-90",
            )}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
