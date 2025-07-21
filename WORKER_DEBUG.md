# Debugging del Worker de Transcripción

## 1. Verificar el Worker en Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Busca el servicio `video-transcription-worker`
3. Verifica que esté "Live" (verde)
4. Ve a los logs del servicio

## 2. Verificar Variables de Entorno

El worker necesita estas variables en Render:

```
SUPABASE_URL=https://lfbpamgjqrbuhkzqmhxt.supabase.co
SUPABASE_SERVICE_KEY=[tu service key de Supabase]
OPENAI_API_KEY=[tu API key de OpenAI]
```

## 3. Verificar Trigger en Supabase

Ejecuta esto en Supabase SQL Editor para verificar:

```sql
-- Ver si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_video_response_created';

-- Ver respuestas pendientes
SELECT 
    id,
    assignment_id,
    question_id,
    processing_status,
    data->>'video_url' as video_url,
    created_at
FROM responses 
WHERE 
    data->>'type' = 'video' 
    AND processing_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

## 4. Probar Manualmente el Worker

Si el worker está en Render, puedes hacer una petición GET al health check:

```bash
curl https://[tu-worker-url].onrender.com/health
```

## 5. Verificar Logs del Worker

En los logs de Render deberías ver:

```
INFO: Processing pending video responses...
INFO: Found X pending responses
INFO: Processing response: [id]
INFO: Downloading video from: [url]
INFO: Transcribing video...
INFO: Transcription completed successfully
```

## 6. Solución de Problemas Comunes

### El video no se marca como 'pending'
- Verifica que el trigger esté activo
- Asegúrate de que el campo `data` tenga `type: 'video'`

### El worker no procesa videos
- Verifica las variables de entorno
- Revisa los logs en Render
- Asegúrate de que el worker esté corriendo

### Error de OpenAI
- Verifica tu API key
- Revisa el límite de tu cuenta OpenAI
- El archivo debe ser menor a 25MB

### Error de Supabase
- Verifica el service key (no el anon key)
- Revisa las políticas RLS

## 7. Forzar Reprocesamiento

Si necesitas reprocesar un video:

```sql
UPDATE responses 
SET processing_status = 'pending'
WHERE id = '[response_id]';
```

## 8. URL del Worker Desplegado

El worker debería estar en:
```
https://video-transcription-worker.onrender.com
``` 