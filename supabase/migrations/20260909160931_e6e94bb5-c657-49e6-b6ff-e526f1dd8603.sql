ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meet_location text,
  ADD COLUMN IF NOT EXISTS meet_date text,
  ADD COLUMN IF NOT EXISTS meet_time text;