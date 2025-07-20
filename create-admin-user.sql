-- Script para crear un usuario administrador de prueba
-- IMPORTANTE: Cambia el email y la contraseña antes de ejecutar en producción

-- Primero, verificamos si ya existe un admin
DO $$
BEGIN
    -- Verificar si existe al menos un usuario con rol admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE role = 'admin'
    ) THEN
        RAISE NOTICE 'No se encontraron usuarios admin. Por favor:';
        RAISE NOTICE '1. Crea un usuario en Supabase Dashboard > Authentication > Users';
        RAISE NOTICE '2. Luego ejecuta el siguiente UPDATE para hacerlo admin:';
        RAISE NOTICE '';
        RAISE NOTICE 'UPDATE public.profiles SET role = ''admin'' WHERE email = ''tu-email@ejemplo.com'';';
    ELSE
        RAISE NOTICE 'Ya existe al menos un usuario admin en el sistema.';
    END IF;
END $$;

-- Query para verificar usuarios existentes y sus roles
SELECT 
    p.id,
    p.email,
    p.role,
    p.first_name,
    p.last_name,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;

-- Si necesitas hacer admin a un usuario existente, usa:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com'; 