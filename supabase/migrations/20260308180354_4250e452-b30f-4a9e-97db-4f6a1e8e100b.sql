-- Add Shopify sync tracking fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS shopify_product_id bigint,
ADD COLUMN IF NOT EXISTS shopify_synced_at timestamp with time zone;

-- Optional uniqueness for mapping (multiple NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS products_shopify_product_id_key
ON public.products (shopify_product_id)
WHERE shopify_product_id IS NOT NULL;