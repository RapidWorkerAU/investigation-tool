alter table public.access_periods
add column if not exists subscription_cancellation_email_sent_at timestamptz;
