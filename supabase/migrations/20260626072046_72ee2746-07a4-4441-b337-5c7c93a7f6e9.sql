
-- Add publishing flags
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();

UPDATE public.products SET status = COALESCE(status,'published'), published = COALESCE(published,true), is_visible = COALESCE(is_visible,true), published_at = COALESCE(published_at, now());

-- Normalize category slugs to lowercase (avoid conflicts)
UPDATE public.categories SET slug = lower(slug) WHERE slug <> lower(slug);

-- Ensure canonical categories exist
INSERT INTO public.categories (name, slug)
SELECT 'T-SHIRTS','t-shirts' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE lower(slug)='t-shirts');

-- Backfill product category_id from product name rules where missing
WITH cats AS (
  SELECT id, lower(slug) AS slug FROM public.categories
)
UPDATE public.products p
SET category_id = c.id
FROM cats c
WHERE p.category_id IS NULL
  AND c.slug = CASE
    WHEN lower(p.name) LIKE '%girly%' THEN 'femme'
    WHEN lower(p.name) LIKE '%boi%'   THEN 'homme'
    WHEN lower(p.name) LIKE '%global%' THEN 'global'
    ELSE 't-shirts'
  END;
