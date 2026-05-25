# Lead Map Access

This flow adds a separate guest path for read-only lead-magnet maps.

## Routes

- Landing page: `/case-study/[slug]`
- Guest viewer: `/lead-map/[slug]`
- Redemption API: `POST /api/lead-access/redeem`
- Admin generator page: `/lead-access`
- Admin generator API: `POST /api/lead-access/admin/create`

## Required env

Add this to `.env.local`:

```env
LEAD_ACCESS_SESSION_SECRET=replace-with-a-long-random-secret
```

If omitted, the app falls back to `SUPABASE_SERVICE_ROLE_KEY`, but a dedicated secret is preferred.

## Create a campaign

Replace the map id with the case-study map you want to expose.

```sql
insert into public.lead_map_campaigns (
  slug,
  map_id,
  title,
  description,
  session_duration_hours
)
values (
  'piper-alpha',
  'e9df9c19-104d-49b5-ada6-14875b46b528',
  'Piper Alpha',
  'Read-only case study access for the Piper Alpha investigation map.',
  0
);
```

`session_duration_hours` is constrained to `0` through `24`. Use `0` for no app-level expiry; matching email and access code checks still apply.

## Generate access codes

Use the internal generator page after the campaign exists:

- `/lead-access`

Enter:

- the campaign slug such as `piper-alpha`
- the recipient email
- an optional internal note

The app will:

- generate a unique plaintext code
- store only the normalized SHA-256 hash
- bind the code to that email address
- revoke any older unused code for the same campaign/email pair
- show recent generation and redemption activity in the admin page

The plaintext code is only shown once at generation time, so copy it into your email to the recipient.

## Redemption behaviour

- First successful redemption stores the submitted email and the redemption timestamp.
- If the code was generated for a specific email, redemption is only allowed for that email.
- For campaigns with a positive `session_duration_hours`, the code cannot be redeemed again.
- For campaigns with `session_duration_hours = 0`, the same email/code pair can be used again and there is no app-level session expiry.
- The same browser can close and reopen the guest viewer while the signed guest-session cookie is present.
