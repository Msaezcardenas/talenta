# Backend de Procesamiento de Videos con Whisper

## Arquitectura Propuesta

### 1. Base de Datos (Supabase)

La estructura ya está definida en `supabase-setup.sql`. Las transcripciones se almacenan directamente en la tabla `responses`:

- Campo `data` (JSONB): Contiene el video_url y después de procesar, también incluirá:
  - `transcript`: El texto transcrito
  - `timestamped_transcript`: Array de segmentos con timestamps
- Campo `processing_status`: Estados del procesamiento (pending/processing/completed/failed)

No se necesitan cambios en la base de datos, ya que la estructura existente soporta las transcripciones.

### 2. Trigger en Supabase

Crea una función y trigger para cuando se sube un video:

```sql
-- Función para actualizar processing_status cuando hay un nuevo video
CREATE OR REPLACE FUNCTION public.mark_video_for_processing()
RETURNS trigger AS $$
BEGIN
    -- Solo procesar si es una respuesta de video
    IF (NEW.data->>'type' = 'video' AND NEW.data->>'video_url' IS NOT NULL) THEN
        -- Actualizar processing_status a 'pending'
        NEW.processing_status := 'pending';
        
        -- Notificar via pg_notify (opcional)
        PERFORM pg_notify('new_video_upload', json_build_object(
            'response_id', NEW.id,
            'video_url', NEW.data->>'video_url'
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevas respuestas de video
CREATE TRIGGER on_video_response_created
    BEFORE INSERT ON public.responses
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_video_for_processing();
```

### 3. Worker en Render (Node.js/TypeScript)

Crea un worker que procese los videos:

```typescript
// worker/src/index.ts
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

const execAsync = promisify(exec)

// Configuración
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Necesitas service key para bypass RLS
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Función principal del worker
async function processVideos() {
  console.log('Checking for pending videos...')
  
  try {
    // Buscar respuestas de video pendientes
    const { data: pendingResponses, error } = await supabase
      .from('responses')
      .select('*')
      .eq('processing_status', 'pending')
      .eq('data->>type', 'video')
      .limit(5) // Procesar máximo 5 a la vez
    
    if (error) throw error
    
    if (!pendingResponses || pendingResponses.length === 0) {
      console.log('No pending videos found')
      return
    }
    
    // Procesar cada video
    for (const response of pendingResponses) {
      await processVideo(response)
    }
  } catch (error) {
    console.error('Error in worker:', error)
  }
}

async function processVideo(response: any) {
  const { id, data } = response
  const videoUrl = data.video_url
  
  console.log(`Processing video for response ${id}`)
  
  try {
    // Actualizar estado a processing
    await supabase
      .from('responses')
      .update({ processing_status: 'processing' })
      .eq('id', id)
    
    // Descargar video
    const tempDir = path.join('/tmp', id)
    await fs.mkdir(tempDir, { recursive: true })
    const videoPath = path.join(tempDir, 'video.webm')
    
    // Descargar usando curl o wget
    await execAsync(`curl -o "${videoPath}" "${videoUrl}"`)
    
    // Convertir a audio usando ffmpeg
    const audioPath = path.join(tempDir, 'audio.wav')
    await execAsync(`ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${audioPath}"`)
    
    // Transcribir con Whisper API
    const audioFile = await fs.readFile(audioPath)
    const transcriptionResult = await openai.audio.transcriptions.create({
      file: new File([audioFile], 'audio.wav', { type: 'audio/wav' }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })
    
    // Guardar transcripción en el campo data JSONB
    const updatedData = {
      ...data,
      transcript: transcriptionResult.text,
      timestamped_transcript: transcriptionResult.segments
    }
    
    await supabase
      .from('responses')
      .update({
        data: updatedData,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    // Limpiar archivos temporales
    await fs.rm(tempDir, { recursive: true })
    
    console.log(`Successfully processed response ${id}`)
  } catch (error: any) {
    console.error(`Error processing response ${id}:`, error)
    
    // Actualizar estado a failed
    await supabase
      .from('responses')
      .update({
        processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  }
}

// Ejecutar cada 30 segundos
setInterval(processVideos, 30000)

// Ejecutar inmediatamente al iniciar
processVideos()

console.log('Worker started, checking for videos every 30 seconds...')
```

### 4. Dockerfile para el Worker

```dockerfile
FROM node:18-alpine

# Instalar ffmpeg
RUN apk add --no-cache ffmpeg curl

WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Compilar TypeScript
RUN npm run build

CMD ["node", "dist/index.js"]
```

### 5. Variables de Entorno en Render

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_KEY=tu_service_key
OPENAI_API_KEY=tu_openai_api_key
```

### 6. Alternativa: Edge Function en Supabase

Si prefieres usar Supabase Edge Functions:

```typescript
// supabase/functions/process-video/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { response_id, video_url } = await req.json()
    
    // Aquí procesarías el video con Whisper
    // Nota: Las Edge Functions tienen límites de tiempo (30s)
    // Por eso es mejor usar un worker externo para videos largos
    
    return new Response(
      JSON.stringify({ message: 'Processing started' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Consideraciones de Escalabilidad

1. **Rate Limiting**: OpenAI tiene límites de rate, considera usar una cola con retry
2. **Costos**: Whisper API cobra por minuto de audio (~$0.006/min)
3. **Almacenamiento**: Los videos pueden ocupar mucho espacio, considera limpiarlos después de procesar
4. **Timeouts**: Videos largos pueden tardar, asegúrate de configurar timeouts apropiados
5. **Monitoreo**: Implementa logs y alertas para videos fallidos

## Flujo Completo

1. Candidato sube video → Se guarda en Supabase Storage
2. Trigger actualiza `processing_status` a 'pending' en la tabla `responses`
3. Worker detecta respuestas de video pendientes
4. Worker descarga video, convierte a audio, transcribe con Whisper
5. Worker actualiza el campo `data` con la transcripción y marca `processing_status` como 'completed'
6. UI del admin muestra video + transcripción lado a lado

## Notas Importantes

- Las transcripciones se almacenan en el campo JSONB `data` de la tabla `responses`
- No se necesita una tabla separada de transcripciones
- El campo `processing_status` ya existe en el esquema original
- La estructura soporta tanto el video_url como la transcripción en el mismo registro 