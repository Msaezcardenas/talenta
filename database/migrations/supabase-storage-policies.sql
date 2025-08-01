-- Políticas de Storage para el bucket 'videos'
-- Estas políticas permiten el acceso basado en el assignment ID

-- Primero, asegurarse de que el bucket existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  true,  -- Público para permitir acceso sin auth
  104857600,  -- 100MB
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/webm', 'video/mp4', 'video/quicktime']::text[];

-- IMPORTANTE: Las políticas de Storage deben configurarse desde el Dashboard de Supabase
-- o usando la API de administración debido a restricciones de permisos.
--
-- Para configurar las políticas manualmente:
--
-- 1. Ve a Storage > videos bucket en el Dashboard de Supabase
-- 2. Click en "Policies"
-- 3. Crear las siguientes políticas:
--
-- POLÍTICA 1: Allow public uploads (INSERT)
-- Enable INSERT for all users
-- Target roles: anon, authenticated
-- WITH CHECK expression: true
--
-- POLÍTICA 2: Allow public read (SELECT)
-- Enable SELECT for all users
-- Target roles: anon, authenticated
-- USING expression: true
--
-- POLÍTICA 3: Allow updates for video owners (UPDATE)
-- Enable UPDATE for all users
-- Target roles: anon, authenticated
-- USING expression: true
-- WITH CHECK expression: true
--
-- Nota: Como el bucket es público y los candidatos no están autenticados,
-- permitimos acceso amplio. La seguridad se maneja a nivel de la aplicación
-- usando los UUIDs únicos de las asignaciones. 