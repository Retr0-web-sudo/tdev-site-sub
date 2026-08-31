ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight numeric NULL,
ADD COLUMN IF NOT EXISTS material text NULL,
ADD COLUMN IF NOT EXISTS brand text NULL,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];