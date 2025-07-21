-- Solución temporal para visualizar respuestas de selección múltiple
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, veamos qué estructura tienen las respuestas actuales
SELECT 
    r.id,
    r.data,
    jsonb_pretty(r.data) as data_pretty,
    q.question_text,
    q.options
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE q.type = 'multiple_choice'
ORDER BY r.created_at DESC
LIMIT 10;

-- 2. Si las respuestas tienen la estructura incorrecta, actualízalas
-- EJEMPLO: Si guardaste {type: 'multiple_choice', selected_option: 'valor'}
-- pero necesitas {type: 'multiple_choice', selected: 'valor'}

-- Opción A: Migrar de selected_option a selected
UPDATE responses r
SET data = 
    CASE 
        WHEN r.data->>'selected_option' IS NOT NULL THEN
            jsonb_set(
                r.data - 'selected_option',
                '{selected}',
                r.data->'selected_option'
            )
        ELSE r.data
    END
FROM questions q
WHERE r.question_id = q.id
AND q.type = 'multiple_choice'
AND r.data->>'selected_option' IS NOT NULL;

-- Opción B: Si no hay ningún valor guardado, agregar uno de prueba
-- SOLO PARA TESTING - NO USAR EN PRODUCCIÓN
UPDATE responses r
SET data = jsonb_set(
    r.data,
    '{selected}',
    '"option1"'::jsonb
)
FROM questions q
WHERE r.question_id = q.id
AND q.type = 'multiple_choice'
AND r.data->>'selected' IS NULL
AND r.data->>'selected_option' IS NULL
-- Limitar a una respuesta específica para testing
AND r.id = '[REEMPLAZAR_CON_ID_REAL]';

-- 3. Verificar el resultado
SELECT 
    r.id,
    r.data->>'type' as type,
    r.data->>'selected' as selected_value,
    q.question_text,
    q.options
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE q.type = 'multiple_choice'
ORDER BY r.created_at DESC; 