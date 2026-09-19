-- orders and order_messages are only accessed server-side via the service role.
-- Add explicit policies so only service_role can operate on them; anon/authenticated stay denied.

CREATE POLICY "Service role full access to orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to order_messages"
ON public.order_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- chat-images bucket: only the service role (server-side signed URL/upload code) may touch files.
CREATE POLICY "Service role full access to chat-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'chat-images')
WITH CHECK (bucket_id = 'chat-images');