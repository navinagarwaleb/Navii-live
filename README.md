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

## Supabase Auth (required for signup / reset emails)

### URL Configuration

Authentication → URL Configuration:

- **Site URL** = app origin only, e.g. `https://your-domain.com`
  - Do **not** set this to `/reset-password` or
    `/auth/callback?next=/reset-password`. That breaks signup confirmation.
- **Redirect URLs** must include:
  - `https://your-domain.com/auth/callback` (Google OAuth)
  - `https://your-domain.com/auth/confirm` (email signup confirm)
  - `https://your-domain.com/auth/confirm?next=/reset-password` (password reset)
  - Optional preview wildcard: `https://*.vercel.app/**`

### Confirm signup email template

Authentication → Email Templates → **Confirm signup** — set the CTA link to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}">
  Confirm your email
</a>
```

### Reset password email template

Authentication → Email Templates → **Reset password**:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  Reset password
</a>
```

`token_hash` confirmation works across devices/browsers (unlike PKCE `?code=`
links that require the same browser that started signup).

## Important security note

The included anonymous `SELECT` policy is required for a browser-based
Supabase Realtime listener. For private events, use Supabase Auth with an
admin-only JWT policy before storing sensitive dedications.
