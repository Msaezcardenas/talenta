# Configurar API Key de OpenAI

## 🚀 En Producción (Render)

1. **Accede a Render**
   - Ve a https://dashboard.render.com
   - Inicia sesión con tu cuenta

2. **Encuentra el Worker**
   - Busca el servicio llamado `video-transcription-worker`
   - Click en el servicio

3. **Configura la Variable de Entorno**
   - En el menú lateral, click en **Environment**
   - Busca `OPENAI_API_KEY`
   - Si existe, actualízala con tu nueva key
   - Si no existe, agrégala:
     ```
     Key: OPENAI_API_KEY
     Value: sk-[tu-api-key-completa]
     ```

4. **Guarda y Reinicia**
   - Click en **Save Changes**
   - El worker se reiniciará automáticamente
   - Espera unos 2-3 minutos

## ✅ Verificar que Funciona

1. **En los Logs de Render**
   - Ve a la pestaña **Logs**
   - Deberías ver:
     ```
     INFO: Worker iniciado - Proceso periódico activo
     INFO: Buscando videos pendientes...
     ```

2. **Sin errores de cuota**
   - Ya NO deberías ver: `Error code: 429 - insufficient_quota`
   - En su lugar verás: `INFO: Transcripción completada exitosamente`

## 📹 Las Transcripciones Comenzarán Automáticamente

- El worker busca videos pendientes cada 30 segundos
- Procesará automáticamente todos los videos sin transcribir
- Las transcripciones aparecerán en la UI de resultados

## 💰 Costos Estimados

- **$0.006 USD** por minuto de audio
- Video de 2 minutos = $0.012 USD
- 100 videos de 2 min = $1.20 USD
- Muy económico para el valor que proporciona

## 🔍 Monitorear el Proceso

En Supabase SQL Editor, ejecuta:

```sql
-- Ver videos siendo procesados
SELECT 
    id,
    processing_status,
    data->>'transcript' as transcript,
    created_at
FROM responses 
WHERE data->>'type' = 'video'
ORDER BY created_at DESC;
```

Estados posibles:
- `pending`: En cola
- `processing`: Transcribiendo
- `completed`: Listo con transcripción
- `failed`: Error (revisar logs) 