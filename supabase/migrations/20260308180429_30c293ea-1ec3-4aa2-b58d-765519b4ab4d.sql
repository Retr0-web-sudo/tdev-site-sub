-- Tighten public page_view inserts (avoid WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  page IS NOT NULL
  AND length(page) > 0
  AND length(page) < 512
  AND (visitor_id IS NULL OR length(visitor_id) < 128)
);