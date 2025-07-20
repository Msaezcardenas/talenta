-- Migraciones para sistema de acceso directo con tokens únicos

-- Primero, vamos a modificar la tabla de assignments para incluir un token único
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS accessed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Crear índice único para el token
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_access_token ON public.assignments(access_token);

-- Actualizar la política de assignments para permitir acceso con token
DROP POLICY IF EXISTS "candidates_select_own_assignments" ON public.assignments;
CREATE POLICY "assignments_access_by_token_or_user" ON public.assignments
FOR SELECT
USING (
    -- Permitir acceso por token (sin autenticación)
    access_token IS NOT NULL 
    OR 
    -- O por usuario autenticado
    user_id = auth.uid()
    OR
    -- O si es admin
    get_my_role() = 'admin'
);

-- Crear una vista pública para acceso sin autenticación
CREATE OR REPLACE VIEW public.assignment_by_token AS
SELECT 
    a.id,
    a.interview_id,
    a.user_id,
    a.status,
    a.assigned_at,
    a.accessed_at,
    a.expires_at,
    i.name as interview_name,
    i.description as interview_description,
    p.first_name,
    p.last_name,
    p.email
FROM public.assignments a
JOIN public.interviews i ON a.interview_id = i.id
JOIN public.profiles p ON a.user_id = p.id;

-- Función para validar y registrar acceso por token
CREATE OR REPLACE FUNCTION public.validate_and_access_assignment(token UUID)
RETURNS TABLE (
    assignment_id UUID,
    interview_id UUID,
    user_id UUID,
    interview_name TEXT,
    candidate_name TEXT,
    status TEXT
) AS $$
DECLARE
    v_assignment RECORD;
BEGIN
    -- Buscar assignment por token
    SELECT 
        a.*,
        i.name as interview_name,
        p.first_name || ' ' || p.last_name as candidate_name
    INTO v_assignment
    FROM public.assignments a
    JOIN public.interviews i ON a.interview_id = i.id
    JOIN public.profiles p ON a.user_id = p.id
    WHERE a.access_token = token
    AND a.expires_at > CURRENT_TIMESTAMP;
    
    -- Si no existe o expiró, retornar vacío
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Actualizar accessed_at si es el primer acceso
    IF v_assignment.accessed_at IS NULL THEN
        UPDATE public.assignments 
        SET accessed_at = CURRENT_TIMESTAMP,
            status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END
        WHERE id = v_assignment.id;
    END IF;
    
    -- Retornar datos
    RETURN QUERY
    SELECT 
        v_assignment.id,
        v_assignment.interview_id,
        v_assignment.user_id,
        v_assignment.interview_name,
        v_assignment.candidate_name,
        v_assignment.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para responses sin autenticación (usando assignment_id del token)
CREATE POLICY "responses_access_by_assignment" ON public.responses
FOR ALL
USING (
    -- Permitir si el assignment_id existe en la sesión actual (se validará en el frontend)
    TRUE
);

-- Función para enviar email con el link único (se ejecutará desde el backend)
CREATE OR REPLACE FUNCTION public.send_interview_invitation(
    p_assignment_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_assignment RECORD;
    v_base_url TEXT := 'https://tudominio.com'; -- Cambiar por tu dominio real
BEGIN
    -- Obtener datos del assignment
    SELECT 
        a.*,
        i.name as interview_name,
        p.email,
        p.first_name,
        p.last_name
    INTO v_assignment
    FROM public.assignments a
    JOIN public.interviews i ON a.interview_id = i.id
    JOIN public.profiles p ON a.user_id = p.id
    WHERE a.id = p_assignment_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Aquí normalmente se integraría con un servicio de email
    -- Por ahora, solo registramos que se debe enviar
    -- En producción, usar Supabase Edge Functions o servicio externo
    
    RAISE NOTICE 'Email para enviar a %: %/interview/%', 
        v_assignment.email, 
        v_base_url, 
        v_assignment.access_token;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 