
-- Create a public storage bucket for game images
INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true);

-- Allow anyone to view game images
CREATE POLICY "Anyone can view game images" ON storage.objects FOR SELECT USING (bucket_id = 'game-images');

-- Allow admins to upload game images
CREATE POLICY "Admins can upload game images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'game-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update game images
CREATE POLICY "Admins can update game images" ON storage.objects FOR UPDATE USING (bucket_id = 'game-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete game images
CREATE POLICY "Admins can delete game images" ON storage.objects FOR DELETE USING (bucket_id = 'game-images' AND public.has_role(auth.uid(), 'admin'));
