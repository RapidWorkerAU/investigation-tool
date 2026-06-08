# Security Model

This app treats access in three practical groups.

## Public Visitors

Public visitors can view public pages, sign up, log in, and redeem a case-study email/code pair.

They must not be able to call privileged Supabase RPC functions directly. Public case-study access goes through the Next.js lead-access routes, which validate the email/code pair and then issue a signed, HTTP-only session cookie.

## Signed-In Users

Signed-in users can use dashboard features that are part of their account:

- create maps only when their subscription, organisation access, or platform admin status allows it
- list maps they own or are members of
- edit maps only when they own the map or have a write role
- save and delete templates only when the template helper functions say they can edit them
- view active case-study maps in read-only mode

Some Supabase warnings remain because these dashboard actions are implemented as `SECURITY DEFINER` RPC functions. That is intentional where the browser needs the action, but every function must validate the current authenticated user before reading or changing data.

## Backend Service Role

The service role key is server-only. It is used by Next.js API routes after the route has checked the request, such as:

- signup email-existence checks
- accepting organisation invites for the authenticated account
- refreshing billing state
- starting free account access
- case-study code generation and validation

The service role key must never be exposed to browser code.

## Abuse Controls

The app includes best-effort server-side rate limits for high-risk or expensive routes:

- signup
- case-study code redemption
- guest case-study notes
- report generation
- map suggestions
- free account start
- site-error email reports

These limits protect normal deployments from accidental loops and basic abuse. For enterprise customers, add edge/WAF rate limiting at the hosting layer as well, because in-memory limits are per server instance.

## Browser Headers

The app sends baseline security headers:

- deny iframe embedding
- prevent MIME-type sniffing
- restrict referrer detail
- disable camera, microphone, geolocation, and payment browser permissions
- enable HSTS for HTTPS deployments

## Case-Study Access

Case-study viewers use email/code access and see a read-only map. They do not get edit rights, report generation, dashboard access, or private map access from the case-study flow.
