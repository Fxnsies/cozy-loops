ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.order_messages DROP CONSTRAINT IF EXISTS order_messages_order_id_fkey;
ALTER TABLE public.order_messages ADD CONSTRAINT order_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;