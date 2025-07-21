-- Ver la estructura exacta del campo data en responses
SELECT 
    id,
    processing_status,
    jsonb_pretty(data) as data_formatted,
    data->>'transcript' as transcript_from_data,
    data->>'video_url' as video_url_from_data,
    data->>'type' as type_from_data
FROM responses
WHERE id = 'c3b2938d-3bd2-4d27-8960-dcb22a5990e9'; 