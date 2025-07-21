-- Políticas para permitir acceso anónimo basado en assignment UUID

-- 1. Políticas para la tabla assignments
DROP POLICY IF EXISTS "Allow anonymous read assignments by UUID" ON assignments;
CREATE POLICY "Allow anonymous read assignments by UUID" ON assignments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous update assignment status" ON assignments;
CREATE POLICY "Allow anonymous update assignment status" ON assignments
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- 2. Políticas para la tabla interviews  
DROP POLICY IF EXISTS "Allow anonymous read interviews" ON interviews;
CREATE POLICY "Allow anonymous read interviews" ON interviews
    FOR SELECT USING (true);

-- 3. Políticas para la tabla questions
DROP POLICY IF EXISTS "Allow anonymous read questions" ON questions;
CREATE POLICY "Allow anonymous read questions" ON questions
    FOR SELECT USING (true);

-- 4. Políticas para la tabla profiles
DROP POLICY IF EXISTS "Allow anonymous read profiles" ON profiles;
CREATE POLICY "Allow anonymous read profiles" ON profiles
    FOR SELECT USING (true);

-- 5. Políticas para la tabla responses
DROP POLICY IF EXISTS "Allow anonymous insert responses" ON responses;
CREATE POLICY "Allow anonymous insert responses" ON responses
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update responses" ON responses;
CREATE POLICY "Allow anonymous update responses" ON responses
    FOR UPDATE USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read responses" ON responses;
CREATE POLICY "Allow anonymous read responses" ON responses
    FOR SELECT USING (true);

-- 6. Configurar el bucket de storage para permitir uploads anónimos
-- IMPORTANTE: Ejecutar esto en la sección de SQL Editor de Supabase

-- Primero, asegurarse de que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, false, 104857600, ARRAY['video/webm', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/webm', 'video/mp4', 'video/quicktime'];

-- 7. Políticas para el bucket de videos
-- Permitir upload anónimo
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
CREATE POLICY "Allow anonymous uploads" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Permitir lectura pública
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow public read" ON storage.objects 
    FOR SELECT USING (bucket_id = 'videos');

-- Permitir update/upsert anónimo
DROP POLICY IF EXISTS "Allow anonymous update" ON storage.objects;
CREATE POLICY "Allow anonymous update" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'videos')
    WITH CHECK (bucket_id = 'videos');

-- Permitir delete para admins autenticados
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
CREATE POLICY "Allow authenticated delete" ON storage.objects 
    FOR DELETE USING (bucket_id = 'videos' AND auth.role() = 'authenticated'); 