
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a message (contact form)
CREATE POLICY "Anyone can submit messages" ON public.messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(name) > 0 AND length(name) < 200
    AND email IS NOT NULL AND length(email) > 0 AND length(email) < 255
    AND subject IS NOT NULL AND length(subject) > 0 AND length(subject) < 300
    AND message IS NOT NULL AND length(message) > 0 AND length(message) < 5000
  );

-- Admins can view all messages
CREATE POLICY "Admins can view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update messages (reply, mark read)
CREATE POLICY "Admins can update messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages" ON public.messages
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
