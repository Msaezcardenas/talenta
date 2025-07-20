-- Añadir columna access_token a la tabla assignments
ALTER TABLE public.assignments 
ADD COLUMN access_token TEXT UNIQUE;

-- Generar tokens únicos para las asignaciones existentes (si las hay)
UPDATE public.assignments 
SET access_token = gen_random_uuid()::text || '-' || gen_random_uuid()::text
WHERE access_token IS NULL;

-- Hacer la columna NOT NULL después de actualizar los registros existentes
ALTER TABLE public.assignments 
ALTER COLUMN access_token SET NOT NULL;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX idx_assignments_access_token ON public.assignments(access_token);

-- Función para validar acceso por token
CREATE OR REPLACE FUNCTION validate_interview_access(token TEXT)
RETURNS TABLE (
  assignment_id UUID,
  interview_id UUID,
  user_id UUID,
  status TEXT,
  interview_name TEXT,
  candidate_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as assignment_id,
    a.interview_id,
    a.user_id,
    a.status,
    i.name as interview_name,
    p.email as candidate_email
  FROM assignments a
  JOIN interviews i ON a.interview_id = i.id
  JOIN profiles p ON a.user_id = p.id
  WHERE a.access_token = token
  AND a.status != 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 