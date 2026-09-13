# Navii Live

A mobile-first song request wizard and real-time performer dashboard built with
Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style components,
Supabase, and Lucide.

## Setup

1. Copy `.env.example` to `.env.local` and add your Supabase credentials.
2. Set a strong `ADMIN_PASSWORD`.
3. Add the Supabase service-role key for protected admin status updates. Never
   expose this key through a `NEXT_PUBLIC_` variable.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Add active rows to the `songs` table.
6. Start the app with `npm run dev`.

The audience flow is at `/request`; the PIN-protected queue is at `/admin`.
Without Supabase credentials, `/request` uses demo songs and simulates a
successful request so the UI can be previewed.

## Important security note

The included anonymous `SELECT` policy is required for a browser-based
Supabase Realtime listener. For private events, use Supabase Auth with an
admin-only JWT policy before storing sensitive dedications.
