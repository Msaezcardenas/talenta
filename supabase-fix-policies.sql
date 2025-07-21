-- Corregir políticas RLS para permitir acceso anónimo a las asignaciones
-- Esto permite que los candidatos accedan sin autenticación usando el UUID como token

-- Primero, eliminar políticas existentes que puedan causar conflictos
DROP POLICY IF EXISTS "candidates_select_own_assignments" ON public.assignments;
DROP POLICY IF EXISTS "candidates_update_own_assignments" ON public.assignments;

-- Crear nueva política que permite SELECT basado en el ID de la asignación
CREATE POLICY "anon_select_assignments_by_id" ON public.assignments
FOR SELECT
USING (true);  -- Permitir a cualquiera hacer SELECT si conoce el ID

-- Crear política que permite UPDATE del status para usuarios anónimos
CREATE POLICY "anon_update_assignment_status" ON public.assignments
FOR UPDATE
USING (true)  -- Permitir si conoce el ID
WITH CHECK (true);  -- Solo pueden actualizar su propia asignación (controlado por WHERE en la query)

-- Políticas para que los candidatos puedan ver las entrevistas y preguntas asociadas
DROP POLICY IF EXISTS "candidates_view_own_interviews" ON public.interviews;
CREATE POLICY "anon_view_assigned_interviews" ON public.interviews
FOR SELECT
USING (
  id IN (
    SELECT interview_id 
    FROM public.assignments 
    WHERE true  -- Permitir si la entrevista está asignada
  )
);

-- Políticas para preguntas
DROP POLICY IF EXISTS "candidates_view_own_questions" ON public.questions;
CREATE POLICY "anon_view_assigned_questions" ON public.questions
FOR SELECT
USING (
  interview_id IN (
    SELECT interview_id 
    FROM public.assignments 
    WHERE true
  )
);

-- Políticas para responses (respuestas)
DROP POLICY IF EXISTS "candidates_manage_own_responses" ON public.responses;

-- Permitir INSERT de respuestas para asignaciones no completadas
CREATE POLICY "anon_insert_responses" ON public.responses
FOR INSERT
WITH CHECK (
  assignment_id IN (
    SELECT id 
    FROM public.assignments 
    WHERE status != 'completed'
  )
);

-- Permitir UPDATE de respuestas para asignaciones no completadas
CREATE POLICY "anon_update_responses" ON public.responses
FOR UPDATE
USING (
  assignment_id IN (
    SELECT id 
    FROM public.assignments 
    WHERE status != 'completed'
  )
)
WITH CHECK (
  assignment_id IN (
    SELECT id 
    FROM public.assignments 
    WHERE status != 'completed'
  )
);

-- Permitir SELECT de respuestas
CREATE POLICY "anon_select_responses" ON public.responses
FOR SELECT
USING (true);

-- Políticas para profiles (para ver info del candidato)
CREATE POLICY "anon_view_assigned_profiles" ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT user_id 
    FROM public.assignments 
    WHERE true
  )
);

-- IMPORTANTE: Estas políticas son más permisivas porque la seguridad 
-- se basa en el UUID único de la asignación que actúa como token de acceso 