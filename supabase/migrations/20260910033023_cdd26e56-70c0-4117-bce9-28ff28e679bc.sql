ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tutorial_url text;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.order_messages ALTER COLUMN body SET DEFAULT '';