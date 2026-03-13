# Investigation Tool

Minimal scaffold for www.investigationtool.com.au

## Run
1. Copy `.env.example` to `.env.local`
2. Fill values
3. `npm run dev`

## Pages included
- /
- /login
- /forgot-password
- /confirm-account
- /subscribe
- /checkout
- /checkout/success
- /checkout/cancel
- /dashboard
- /account
- /account/delete
- /account/export
- /investigations/[id]
- /investigations/[id]/canvas
- /privacy
- /terms
- custom 404

## Notes
- Canvas supports the migrated incident investigation mode.
- Stripe checkout session route is included.
- Supabase auth wiring is included for login/signup/reset/logout.
