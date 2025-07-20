# 🚀 Guía de Deployment - Talium MVP

Esta guía te ayudará a deployar la aplicación Talium en producción con todas las funcionalidades activas.

## 📋 Requisitos Previos

1. **Cuenta en Vercel** (para el frontend)
2. **Cuenta en Render.com** (para el worker - ya configurado)
3. **Cuenta en Resend** (para envío de emails)
4. **Proyecto en Supabase** (ya configurado)

## 🔧 Configuración Paso a Paso

### 1. Configurar Resend para Emails

1. Crea una cuenta en [Resend](https://resend.com)
2. Obtén tu API Key desde el dashboard
3. Para usar un dominio personalizado:
   - Verifica tu dominio en Resend
   - Configura los registros DNS según las instrucciones
   - Espera la verificación
4. Si no tienes dominio, puedes usar `onboarding@resend.dev` para pruebas

### 2. Variables de Entorno

Crea un archivo `.env.production.local` con:

```env
# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=https://iuzjqsxuhplzvrcdwpfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# OpenAI (para el worker)
OPENAI_API_KEY=tu_openai_key

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# URL de la app (actualizar con tu dominio)
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### 3. Configurar el Trigger en Supabase

Ejecuta este SQL en el editor de Supabase para activar el procesamiento de videos:

```sql
-- Función para marcar videos para procesamiento
CREATE OR REPLACE FUNCTION public.mark_video_for_processing()
RETURNS trigger AS $$
BEGIN
    -- Solo procesar si es una respuesta de video
    IF (NEW.data->>'type' = 'video' AND NEW.data->>'video_url' IS NOT NULL) THEN
        -- Actualizar processing_status a 'pending'
        NEW.processing_status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevas respuestas de video
DROP TRIGGER IF EXISTS on_video_response_created ON public.responses;
CREATE TRIGGER on_video_response_created
    BEFORE INSERT ON public.responses
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_video_for_processing();
```

### 4. Deploy en Vercel

1. **Conecta tu repositorio**
   ```bash
   # Si aún no lo has hecho
   git remote add origin tu-repo-url
   git push -u origin main
   ```

2. **Importa en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Importa tu repositorio de GitHub/GitLab
   - Configura las variables de entorno:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
     - `NEXT_PUBLIC_APP_URL` (se actualizará después del deploy)

3. **Deploy**
   - Click en "Deploy"
   - Espera a que termine el build

4. **Actualiza la URL**
   - Una vez deployado, copia la URL de producción
   - Actualiza `NEXT_PUBLIC_APP_URL` en las variables de entorno
   - Redeploy para aplicar el cambio

### 5. Verificar el Worker

El worker ya está deployado en Render. Verifica que esté funcionando:

1. Ve al dashboard de Render
2. Revisa los logs del worker
3. Asegúrate de que esté en estado "Running"

### 6. Configurar Dominio Personalizado (Opcional)

En Vercel:
1. Ve a Settings → Domains
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones

### 7. Actualizar el Email Sender

Si tienes un dominio verificado en Resend:

```typescript
// En src/app/api/send-interview-invitation/route.ts
// Cambia:
from: 'Talium <onboarding@resend.dev>'
// Por:
from: 'Talium <noreply@tu-dominio.com>'
```

## ✅ Checklist de Verificación

- [ ] Worker de transcripción ejecutándose en Render
- [ ] API Key de Resend configurada
- [ ] Variables de entorno en Vercel
- [ ] Trigger de video creado en Supabase
- [ ] URL de producción actualizada
- [ ] Emails enviándose correctamente
- [ ] Videos procesándose y transcribiéndose

## 🧪 Testing en Producción

1. **Test de Email**:
   - Crea una entrevista de prueba
   - Asigna a un candidato con tu email
   - Verifica que llegue el email con el link

2. **Test de Video**:
   - Accede con el link del email
   - Graba un video de prueba
   - Verifica en la página de resultados que aparezca la transcripción

3. **Test de Flujo Completo**:
   - Crea entrevista → Asigna candidato → Recibe email
   - Responde entrevista → Verifica transcripción
   - Revisa resultados como admin

## 🚨 Troubleshooting

### Emails no se envían
- Verifica que `RESEND_API_KEY` esté configurada
- Revisa los logs en Vercel Functions
- Verifica el dominio en Resend

### Videos no se transcriben
- Revisa los logs del worker en Render
- Verifica que el trigger esté creado
- Confirma que `processing_status` se actualice a 'pending'

### Links de invitación no funcionan
- Verifica que `NEXT_PUBLIC_APP_URL` esté correcta
- Revisa que el token se genere correctamente

## 📊 Monitoreo

- **Frontend**: Dashboard de Vercel para analytics y logs
- **Worker**: Dashboard de Render para logs y métricas
- **Emails**: Dashboard de Resend para estadísticas
- **Base de datos**: Dashboard de Supabase para queries

## 🎉 ¡Listo!

Tu aplicación Talium está ahora en producción con:
- ✅ Envío real de emails
- ✅ Transcripción automática de videos
- ✅ Sistema completo de entrevistas

Para soporte o preguntas, revisa la documentación o contacta al equipo de desarrollo. 