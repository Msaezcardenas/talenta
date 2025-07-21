-- Verificar transcripción del video procesado
-- Ejecutar en Supabase SQL Editor

-- Ver la respuesta específica que se procesó
SELECT 
    id,
    processing_status,
    data,
    jsonb_pretty(data) as data_formatted,
    data->>'transcript' as transcript,
    data->>'transcription' as transcription,
    created_at,
    updated_at
FROM responses
WHERE id = 'c3b2938d-3bd2-4d27-8960-dcb22a5990e9';

-- Ver todas las respuestas de video con sus transcripciones
SELECT 
    r.id,
    r.processing_status,
    r.data->>'video_url' as video_url,
    r.data->>'transcript' as transcript,
    LENGTH(r.data->>'transcript') as transcript_length,
    r.created_at,
    r.updated_at
FROM responses r
WHERE r.data->>'type' = 'video'
AND r.processing_status = 'completed'
ORDER BY r.updated_at DESC
LIMIT 10; 