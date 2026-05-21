alter table public.lead_map_access_codes
  add column if not exists issued_code text;

comment on column public.lead_map_access_codes.issued_code is
'Admin-visible plaintext lead access code as issued. Existing historical rows may be null because only the hash and last four characters were previously stored.';
