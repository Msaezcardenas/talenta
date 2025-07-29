-- Verificar estructura de respuestas en SkillzaPro
-- Ejecutar en Supabase SQL Editor

-- 1. Ver TODAS las respuestas con su estructura completa
SELECT 
    r.id,
    r.assignment_id,
    r.question_id,
    r.data,
    jsonb_pretty(r.data) as data_formatted,
    q.type as question_type,
    q.question_text,
    q.options,
    a.user_id,
    p.email
FROM responses r
JOIN questions q ON r.question_id = q.id
JOIN assignments a ON r.assignment_id = a.id
JOIN profiles p ON a.user_id = p.id
ORDER BY r.created_at DESC;

-- 2. Específicamente para respuestas de selección múltiple
SELECT 
    r.id,
    r.data->>'type' as saved_type,
    r.data->>'selected' as selected_value,
    r.data,
    q.question_text,
    q.options
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE q.type = 'multiple_choice'
ORDER BY r.created_at DESC;

-- 3. Verificar si hay discrepancia entre el tipo de pregunta y el tipo guardado
SELECT 
    r.id,
    q.type as question_type,
    r.data->>'type' as response_type,
    CASE 
        WHEN q.type::text != r.data->>'type' THEN 'MISMATCH!'
        ELSE 'OK'
    END as type_match,
    r.data
FROM responses r
JOIN questions q ON r.question_id = q.id;

-- 4. Corregir respuestas que no tienen el campo 'selected' pero sí tienen otros campos
-- SOLO ejecutar si encuentras respuestas mal formateadas
UPDATE responses r
SET data = jsonb_build_object(
    'type', 'multiple_choice',
    'selected', COALESCE(
        r.data->>'selected',
        r.data->>'selected_option',
        r.data->>'value',
        r.data->>'answer'
    )
)
FROM questions q
WHERE r.question_id = q.id
AND q.type = 'multiple_choice'
AND r.data->>'selected' IS NULL
RETURNING r.id, r.data; 