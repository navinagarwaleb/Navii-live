import Link from "next/link";
import { ArrowLeft, Music2 } from "lucide-react";

export default function AdminSongsPage() {
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

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#292524] p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10 text-[#F2B76E]">
            <Music2 size={24} />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-semibold">
            Song editor
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A8A29E]">
            Coming next — for now you can manage songs in Supabase. This page
            won’t block your live queue.
          </p>
        </div>
      </div>
    </main>
  );
}
