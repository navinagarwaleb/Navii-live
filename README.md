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

Keep **Confirm email** enabled for OTP signup.

Authentication → Email Templates → **Confirm signup** — include the code in
the body (required for typed OTP):

```html
<h2>Confirm your email</h2>
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>Or confirm with this link:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}">
    Confirm your email
  </a>
</p>
```

If you cannot edit templates and the email has no 6-digit code, typed OTP will
not work — use Confirm email Off, or add custom SMTP + a template that shows
`{{ .Token }}`.

### Reset password email template

Authentication → Email Templates → **Reset password**:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  Reset password
</a>
```

`token_hash` confirmation works across devices/browsers. Default PKCE links do
not. Typed `{{ .Token }}` OTP also works across devices.

## Important security note

The included anonymous `SELECT` policy is required for a browser-based
Supabase Realtime listener. For private events, use Supabase Auth with an
admin-only JWT policy before storing sensitive dedications.
