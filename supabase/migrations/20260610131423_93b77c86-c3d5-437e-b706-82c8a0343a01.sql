
-- 1. PROFILES: restrict SELECT to own + admin
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. DISCOUNT_CODES: lock all client access; server-side via edge functions
DROP POLICY IF EXISTS "Anyone can read discount codes by code" ON public.discount_codes;
DROP POLICY IF EXISTS "Anyone can create discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Anyone can mark codes as used" ON public.discount_codes;
-- Admins can manage policy already exists; no client-readable policy remains

-- 3. PAGE_VIEWS: bound session_duration to prevent analytics skew
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    page IS NOT NULL
    AND length(page) > 0
    AND length(page) < 512
    AND (visitor_id IS NULL OR length(visitor_id) < 128)
    AND (session_duration IS NULL OR (session_duration >= 0 AND session_duration <= 86400))
  );

-- 4. STORAGE custom-designs: require auth + restrict to image MIME, remove broad LIST policy
DROP POLICY IF EXISTS "Anyone can upload design images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view design images" ON storage.objects;

CREATE POLICY "Authenticated users can upload design images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'custom-designs'
    AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif')
  );

-- (Public bucket: files remain accessible via direct public URL without a SELECT policy,
--  so omitting the SELECT policy disables LIST while keeping individual file URLs working.)

-- 5. Hide internal tables from public/anon GraphQL exposure
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.messages FROM anon;
REVOKE SELECT ON public.custom_design_requests FROM anon;
REVOKE SELECT ON public.discount_codes FROM anon, authenticated;
REVOKE SELECT ON public.page_views FROM anon;
