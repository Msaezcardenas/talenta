-- Configuración de Webhook para Video Transcription
-- Este script configura un trigger y función para llamar al webhook cuando se crea un video

-- Función para llamar al webhook
CREATE OR REPLACE FUNCTION public.trigger_video_webhook()
RETURNS trigger AS $$
DECLARE
  webhook_url text;
  response_data jsonb;
BEGIN
  -- Solo procesar si es una respuesta de video
  IF (NEW.data->>'type' = 'video' AND NEW.data->>'video_url' IS NOT NULL) THEN
    
    -- URL del webhook (cambiar en producción)
    webhook_url := 'https://your-worker-url.com/webhook';
    
    -- Preparar datos para el webhook
    response_data := jsonb_build_object(
      'response_id', NEW.id
    );
    
    -- Hacer llamada HTTP al webhook (requiere extensión pg_net)
    PERFORM net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := response_data::text
    );
    
    -- Log para debugging (opcional)
    RAISE NOTICE 'Webhook triggered for video response_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevas respuestas de video
DROP TRIGGER IF EXISTS on_video_response_webhook ON public.responses;
CREATE TRIGGER on_video_response_webhook
  AFTER INSERT ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_video_webhook();

-- Alternativa: Edge Function para webhook (si prefieres no usar pg_net)
-- Esta función puede ser llamada desde una Supabase Edge Function
CREATE OR REPLACE FUNCTION public.get_pending_video_responses()
RETURNS TABLE (
  id uuid,
  video_url text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.data->>'video_url' as video_url,
    r.created_at
  FROM public.responses r
  WHERE 
    r.data->>'type' = 'video' 
    AND r.data->>'video_url' IS NOT NULL
    AND (r.processing_status IS NULL OR r.processing_status = 'pending')
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: Para usar pg_net, primero habilítalo en Supabase:
-- 1. Ve a Database > Extensions
-- 2. Busca "pg_net" 
-- 3. Habilítalo

-- Para configurar el webhook URL en producción:
-- UPDATE la función trigger_video_webhook() con tu URL real 