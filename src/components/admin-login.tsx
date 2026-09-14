"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, Music2 } from "lucide-react";

export function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-[#1C1917] px-6 py-10 text-[#FAFAF9]">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FAFAF9] text-[#1C1917]">
        <Music2 size={25} />
      </div>
      <div className="mt-5 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-[#A8A29E] uppercase">
          Song Table
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-relaxed font-semibold tracking-[-0.02em]">
          Stage dashboard
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#A8A29E]">
          Enter your admin PIN to view requests.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#292524] p-6">
        <form onSubmit={login}>
          <label
            htmlFor="admin-pin"
            className="mb-4 flex items-center gap-2 text-sm font-bold text-[#FAFAF9]"
          >
            <LockKeyhole size={16} /> Admin PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Enter PIN"
            className="min-h-[44px] h-14 w-full rounded-xl border border-white/15 bg-[#1C1917] px-5 text-base text-[#FAFAF9] outline-none placeholder:text-[#A8A29E] focus:border-[#FAFAF9]/40 focus:ring-4 focus:ring-white/10"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FAFAF9] px-5 text-base font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
            disabled={!pin || loading}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Unlock dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
