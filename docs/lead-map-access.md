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
  24
);
```

`session_duration_hours` is currently constrained to `1` through `24`, so 24 hours is the maximum without a schema change.

## Generate one-time codes

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
- The code cannot be redeemed again.
- The same browser can close and reopen the guest viewer until the signed guest-session cookie expires.
- After expiry, the redeemed code stays blocked and the user must request a new code.
