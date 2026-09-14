"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePassword,
  hasEmailPasswordIdentity,
} from "@/lib/create-performer-account";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function AdminChangePasswordForm() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setHasPassword(false);
      return;
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setHasPassword(hasEmailPasswordIdentity(user));
    })();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await changePassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
      setMessage(
        hasPassword
          ? "Password updated."
          : "Password set. You can sign in with email too.",
      );
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Could not update password.",
      );
    }

    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#292524]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
      >
        <span>
          <span className="block font-serif text-xl font-semibold text-[#FAFAF9]">
            Reset Password
          </span>
          <span className="mt-0.5 block text-sm text-[#A8A29E]">
            {open
              ? hasPassword
                ? "Confirm your current password, then choose a new one."
                : "Add a password so you can also sign in with email."
              : "Tap to change your password"}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-[#A8A29E] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <form
          id={panelId}
          onSubmit={(event) => void onSubmit(event)}
          className="grid gap-4 border-t border-white/10 px-5 pt-4 pb-5"
        >
          {hasPassword ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
                Current password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="border-white/15 bg-[#1C1917] pr-12 text-[#FAFAF9]"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                  onClick={() => setShowCurrent((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#A8A29E] transition hover:text-[#FAFAF9]"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              New password
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="border-white/15 bg-[#1C1917] pr-12 text-[#FAFAF9]"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={showNew ? "Hide password" : "Show password"}
                onClick={() => setShowNew((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#A8A29E] transition hover:text-[#FAFAF9]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#A8A29E]">At least 8 characters.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#A8A29E]">
              Confirm new password
            </label>
            <Input
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="border-white/15 bg-[#1C1917] text-[#FAFAF9]"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

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
            disabled={saving || hasPassword === null}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {hasPassword ? "Update password" : "Set password"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
