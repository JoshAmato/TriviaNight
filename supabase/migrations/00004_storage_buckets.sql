-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('host-logos', 'host-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-logos', 'sponsor-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- Storage policies for host-logos
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'host-logos');
CREATE POLICY "Auth upload host-logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth manage host-logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete host-logos" ON storage.objects FOR DELETE
  USING (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for sponsor-logos
CREATE POLICY "Public read sponsor-logos" ON storage.objects FOR SELECT USING (bucket_id = 'sponsor-logos');
CREATE POLICY "Auth upload sponsor-logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sponsor-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth manage sponsor-logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'sponsor-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete sponsor-logos" ON storage.objects FOR DELETE
  USING (bucket_id = 'sponsor-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for question-images
CREATE POLICY "Public read question-images" ON storage.objects FOR SELECT USING (bucket_id = 'question-images');
CREATE POLICY "Auth upload question-images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'question-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth manage question-images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'question-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete question-images" ON storage.objects FOR DELETE
  USING (bucket_id = 'question-images' AND auth.uid()::text = (storage.foldername(name))[1]);
