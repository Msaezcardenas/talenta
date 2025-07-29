-- Script para verificar y configurar usuarios admin en SkillzaPro

-- 1. Ver todos los usuarios y sus roles
SELECT 
    p.id,
    p.email,
    p.role,
    p.first_name,
    p.last_name,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- 2. Ver solo usuarios admin
SELECT * FROM profiles WHERE role = 'admin';

-- 3. Si necesitas hacer a un usuario existente admin
-- Descomenta y modifica el email:
/*
UPDATE profiles 
SET role = 'admin'
WHERE email = 'tu-email@ejemplo.com';
*/

-- 4. Verificar que la tabla profiles existe y tiene las columnas correctas
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';

-- 5. Verificar políticas RLS en la tabla profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 6. Para crear un nuevo usuario admin:
-- Primero crea el usuario en Supabase Auth (desde el dashboard)
-- Luego ejecuta esto con el ID del usuario:
/*
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
    'UUID-DEL-USUARIO-AQUI',
    'admin@skillzapro.com',
    'admin',
    'Admin',
    'SkillzaPro'
);
*/ 