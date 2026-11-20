-- LifeOS – Storage Policies  (migration 003)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents','documents',FALSE,52428800,ARRAY['application/pdf','image/jpeg','image/png','image/gif','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "docs_storage_select" ON storage.objects FOR SELECT USING (bucket_id='documents' AND auth.uid()::TEXT=(storage.foldername(name))[1]);
CREATE POLICY "docs_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='documents' AND auth.uid()::TEXT=(storage.foldername(name))[1]);
CREATE POLICY "docs_storage_delete" ON storage.objects FOR DELETE USING (bucket_id='documents' AND auth.uid()::TEXT=(storage.foldername(name))[1]);
