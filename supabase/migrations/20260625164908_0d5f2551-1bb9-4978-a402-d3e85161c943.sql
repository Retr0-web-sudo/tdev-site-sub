
-- 1) Restrict orders INSERT to status='pending'
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2) Storage UPDATE/DELETE policies for custom-designs bucket (owner or admin only)
CREATE POLICY "Owners can update own design images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'custom-designs' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK (bucket_id = 'custom-designs' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Owners can delete own design images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'custom-designs' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));

-- 3) Disable GraphQL schema exposure to anon/authenticated (app uses PostgREST, not GraphQL)
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
REVOKE ALL ON FUNCTION graphql_public.graphql FROM anon, authenticated;
