-- Verificar la estructura real de los datos
SELECT 
    id,
    processing_status,
    data,
    jsonb_pretty(data) as data_pretty,
    data->>'transcript' as transcript_from_data,
    data->'transcript' IS NOT NULL as has_transcript_in_data
FROM responses
WHERE id IN (
    'c3b2938d-3bd2-4d27-8960-dcb22a5990e9',
    'ffb93792-4672-495a-a457-46685a3d5027'
)
ORDER BY created_at DESC; 