-- Script de Debugging para Respuestas en Talium
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura exacta de las respuestas de selección múltiple
SELECT 
    r.id,
    r.question_id,
    r.data,
    r.data->>'type' as response_type,
    r.data->>'selected' as selected_value,
    r.data->>'selected_option' as selected_option_value,
    q.question_text,
    q.options
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE q.type = 'multiple_choice'
ORDER BY r.created_at DESC
LIMIT 5;

-- 2. Ver estructura de respuestas de video
SELECT 
    r.id,
    r.processing_status,
    r.data,
    r.data->>'video_url' as video_url,
    r.data->>'transcript' as transcript,
    r.data->>'transcription' as transcription,
    r.created_at,
    r.updated_at
FROM responses r
WHERE r.data->>'type' = 'video'
ORDER BY r.created_at DESC
LIMIT 5;

-- 3. Ver una respuesta específica en detalle
-- Reemplaza el ID con uno real de tu base de datos
SELECT 
    id,
    assignment_id,
    question_id,
    data,
    processing_status,
    created_at,
    updated_at
FROM responses
WHERE id = '6a07bea4-b97b-453e-b34d-a87660119f88';

-- 4. Contar respuestas por tipo y estado
SELECT 
    data->>'type' as response_type,
    processing_status,
    COUNT(*) as count
FROM responses
GROUP BY data->>'type', processing_status
ORDER BY response_type, processing_status;

-- 5. Ver respuestas pendientes de procesar
SELECT 
    id,
    data->>'type' as type,
    processing_status,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM responses
WHERE processing_status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- 6. Verificar trigger en responses
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid::regclass::text = 'responses';

-- 7. Ver últimos webhooks (si tienes tabla de logs)
-- Esto depende de si configuraste logging de webhooks
SELECT * FROM supabase_functions.hooks
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10; 