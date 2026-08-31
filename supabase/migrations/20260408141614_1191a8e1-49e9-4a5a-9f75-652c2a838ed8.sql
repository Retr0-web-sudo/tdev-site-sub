
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 10,
  game_name text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own code (by code value)
CREATE POLICY "Anyone can read discount codes by code"
  ON public.discount_codes FOR SELECT
  TO public
  USING (true);

-- Anyone can insert discount codes (generated client-side after game win)
CREATE POLICY "Anyone can create discount codes"
  ON public.discount_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    code IS NOT NULL AND length(code) > 0 AND length(code) < 50
    AND discount_percent > 0 AND discount_percent <= 30
    AND game_name IS NOT NULL AND length(game_name) > 0
  );

-- Admins can manage all discount codes
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow update for marking codes as used
CREATE POLICY "Anyone can mark codes as used"
  ON public.discount_codes FOR UPDATE
  TO anon, authenticated
  USING (used = false)
  WITH CHECK (used = true);
