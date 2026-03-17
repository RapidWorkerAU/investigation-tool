alter table public.access_periods
add column if not exists reminder_3_business_days_sent_at timestamptz,
add column if not exists reminder_day_of_expiry_sent_at timestamptz,
add column if not exists expiry_notice_sent_at timestamptz;
