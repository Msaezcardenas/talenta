-- Trigger para Procesamiento de Videos con Whisper
-- Este trigger marca las respuestas de video como 'pending' para que el worker las procese

-- Función para marcar videos para procesamiento
CREATE OR REPLACE FUNCTION public.mark_video_for_processing()
RETURNS trigger AS $$
BEGIN
    -- Solo procesar si es una respuesta de video con URL
    IF (NEW.data->>'type' = 'video' AND NEW.data->>'video_url' IS NOT NULL) THEN
        -- Actualizar processing_status a 'pending'
        NEW.processing_status := 'pending';
        
        -- Log para debugging (opcional, comentar en producción)
        RAISE NOTICE 'Video marcado para procesamiento: response_id = %, video_url = %', NEW.id, NEW.data->>'video_url';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_video_response_created ON public.responses;

-- Crear trigger para nuevas respuestas de video
CREATE TRIGGER on_video_response_created
    BEFORE INSERT ON public.responses
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_video_for_processing();

-- Comentario: El worker busca periódicamente respuestas donde:
-- processing_status = 'pending' AND data->>'type' = 'video'
-- Luego las procesa secuencialmente 