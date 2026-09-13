"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePassword,
  hasEmailPasswordIdentity,
} from "@/lib/create-performer-account";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function AdminChangePasswordForm() {
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
        hasPassword ? "Password updated." : "Password set. You can sign in with email too.",
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
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#FAFAF9]">
          Password
        </h2>
        <p className="mt-1 text-sm text-[#A8A29E]">
          {hasPassword
            ? "Confirm your current password, then choose a new one."
            : "Add a password so you can also sign in with email."}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#292524] p-5">
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
  );
}
