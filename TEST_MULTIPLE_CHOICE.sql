-- Script de prueba para respuestas de selección múltiple
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, encuentra una pregunta de selección múltiple y su assignment
SELECT 
    a.id as assignment_id,
    q.id as question_id,
    q.question_text,
    q.options,
    p.email
FROM assignments a
JOIN interviews i ON a.interview_id = i.id
JOIN questions q ON q.interview_id = i.id
JOIN profiles p ON a.user_id = p.id
WHERE q.type = 'multiple_choice'
AND a.status = 'completed'
LIMIT 1;

-- 2. Insertar o actualizar una respuesta de prueba
-- REEMPLAZA los IDs con valores reales de la consulta anterior
INSERT INTO responses (
    assignment_id,
    question_id,
    data
) VALUES (
    '104f964f-9449-4619-9e80-f47160aa8d51', -- Reemplazar con assignment_id real
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Reemplazar con question_id real
    jsonb_build_object(
        'type', 'multiple_choice',
        'selected', 'option1' -- Este debe coincidir con un value de las opciones
    )
)
ON CONFLICT (assignment_id, question_id) 
DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- 3. Verificar que se guardó correctamente
SELECT 
    r.id,
    r.data,
    r.data->>'type' as type,
    r.data->>'selected' as selected,
    q.question_text,
    q.options
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE r.assignment_id = '104f964f-9449-4619-9e80-f47160aa8d51' -- Usar el mismo assignment_id
AND q.type = 'multiple_choice'; 