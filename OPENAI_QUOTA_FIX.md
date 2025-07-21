# Solución para Error de Cuota de OpenAI

## Problema Actual
El worker está funcionando correctamente pero no puede transcribir videos porque la cuenta de OpenAI no tiene créditos:

```
Error code: 429 - insufficient_quota
```

## Soluciones

### Opción 1: Agregar Créditos a OpenAI (Recomendado)

1. Ve a https://platform.openai.com/account/billing
2. Agrega un método de pago
3. Agrega créditos (mínimo $5 USD)
4. Los costos de Whisper son:
   - $0.006 por minuto de audio
   - Un video de 2 minutos = $0.012 USD

### Opción 2: Usar Transcripción Simulada Temporal

El worker ya tiene una transcripción simulada que debería funcionar. Si no aparece:

1. En Supabase SQL Editor, ejecuta:
```sql
-- Ver el contenido de una respuesta específica
SELECT 
    id,
    processing_status,
    data
FROM responses 
WHERE id = '6a07bea4-b97b-453e-b34d-a87660119f88';
```

2. Si ves que `data.transcript` tiene contenido pero no se muestra, refresca la página.

### Opción 3: Actualizar Manualmente para Testing

Mientras no tengas créditos, puedes actualizar manualmente:

```sql
UPDATE responses 
SET 
    data = jsonb_set(
        data, 
        '{transcript}', 
        '"[TRANSCRIPCIÓN DE PRUEBA]\n\nHola, mi nombre es [Candidato] y voy a responder sobre cómo organizo mi trabajo cuando tengo tareas de frontend y backend en la misma semana.\n\nGeneralmente empiezo por revisar todas las tareas y las priorizo según las dependencias. Si el backend bloquea el frontend, empiezo por ahí. También me gusta dividir mi día en bloques de tiempo para mantener el foco.\n\nUso herramientas como Trello para organizar las tareas y Git para mantener branches separadas para cada feature."'::jsonb
    ),
    processing_status = 'completed'
WHERE 
    id = '[RESPONSE_ID]'
    AND data->>'type' = 'video';
```

### Opción 4: Usar una API Alternativa Gratuita

Podrías modificar el worker para usar alternativas gratuitas:
- Google Speech-to-Text (300 minutos gratis/mes)
- AssemblyAI (3 horas gratis)
- Rev.ai (5 horas gratis)

## Verificar Estado Actual

Para ver todas las respuestas de video y su estado:

```sql
SELECT 
    r.id,
    r.processing_status,
    r.data->>'video_url' as video_url,
    r.data->>'transcript' as transcript,
    r.created_at,
    a.user_id,
    q.question_text
FROM responses r
JOIN assignments a ON r.assignment_id = a.id
JOIN questions q ON r.question_id = q.id
WHERE r.data->>'type' = 'video'
ORDER BY r.created_at DESC;
```

## Costos Estimados con OpenAI

- Entrevista típica con 3 videos de 2 min cada uno = $0.036 USD
- 100 entrevistas = $3.60 USD
- 1000 entrevistas = $36 USD

Es muy económico para el valor que proporciona. 