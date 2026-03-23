# Email Templates

This project now has a reusable branded email layer in `src/lib/email`.

## App-sent emails via Resend

These templates are intended for emails sent directly by the app:

- `trialStarted`
- `pass30Started`
- `subscriptionStarted`
- `subscriptionRenewed`
- `paymentFailed`
- `accessEndingSoon`
- `accessEndsToday`
- `accessExpired`
- `paymentReceipt`
- `welcome`
- `passwordChanged`

The shared sender is:

- `src/lib/email/resend.ts`

The branded template catalog is:

- `src/lib/email/templates.ts`

Preview all templates in-browser at:

- `/email-preview`

## Supabase auth emails

Supabase sends its own auth emails for:

- account confirmation
- password reset
- email confirmation / email change

Use these templates as the content source when configuring Supabase Auth email templates:

- `confirmAccount`
- `forgotPassword`
- change email confirmation template from `src/lib/email/preview.ts`

For Supabase auth emails, the button target must use Supabase placeholders, not hardcoded app routes:

- `{{ .ConfirmationURL }}`

Do not point account confirmation, password reset, or email change buttons directly at `/login`, `/confirm-account`, or `/auth/set-password`. Supabase must receive the confirmation click first, and then it will redirect back into the app using the configured redirect URL.

Because those emails are initiated by Supabase, they are not sent from Next.js routes unless you replace Supabase's default auth email flow with a custom implementation.

## Required environment variables

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

## Access reminder automation

The project now includes a reminder endpoint for 30 day access periods:

- `POST /api/access/reminders`
- `GET /api/access/reminders`

It sends:

- 3 business day warning
- expires today warning
- expired notice

The endpoint is protected by `CRON_SECRET` when that variable is set. It is designed for a scheduler or cron job and tracks sent reminders on `public.access_periods` so the same reminder is not sent twice.

## Vercel cron

This repo now includes `vercel.json` with a daily cron for:

- `/api/access/reminders`

Current schedule:

- `15 0 * * *`

That is `00:15 UTC`, which is `08:15` in Perth when using AWST.

To make it work in production:

1. Add `CRON_SECRET` in Vercel project environment variables.
2. Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_REPLY_TO_EMAIL` in Vercel too.
3. Deploy the project.

## Where else to add `CRON_SECRET`

Other than Vercel, only add it anywhere that needs to call the reminder endpoint:

- local `.env.local` if you want to test locally
- your production hosting env vars
- any external scheduler secret/header configuration if you use a third-party cron service instead of Vercel

You do not add `CRON_SECRET` to Supabase or Resend unless you are explicitly using Supabase Edge Functions or another worker there to call this endpoint.
