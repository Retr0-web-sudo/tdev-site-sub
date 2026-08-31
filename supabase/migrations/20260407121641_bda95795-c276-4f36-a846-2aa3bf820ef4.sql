
-- Storage bucket for custom design images
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-designs', 'custom-designs', true);

-- Custom design requests table
CREATE TABLE public.custom_design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shirt_color TEXT NOT NULL DEFAULT 'white',
  shirt_size TEXT NOT NULL DEFAULT 'M',
  design_image_url TEXT,
  design_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  quoted_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a design request
CREATE POLICY "Anyone can submit design requests"
  ON public.custom_design_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(name) > 0 AND length(name) < 200
    AND email IS NOT NULL AND length(email) > 0 AND length(email) < 255
    AND quantity > 0 AND quantity <= 100
  );

-- Admins can view all requests
CREATE POLICY "Admins can view design requests"
  ON public.custom_design_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests
CREATE POLICY "Admins can update design requests"
  ON public.custom_design_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete design requests"
  ON public.custom_design_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for custom-designs bucket
CREATE POLICY "Anyone can upload design images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'custom-designs');

CREATE POLICY "Anyone can view design images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'custom-designs');
