# 🚀 Guía de Deployment - SkillzaPro MVP

Esta guía te ayudará a deployar la aplicación SkillzaPro en producción con todas las funcionalidades activas.

## 📋 Requisitos Previos

1. **Cuenta en Vercel** (para el frontend)
2. **Cuenta en Render.com** (para el worker - ya configurado)
3. **Cuenta de Gmail** (para envío de emails)
4. **Proyecto en Supabase** (ya configurado)

## 🔧 Configuración Paso a Paso

### 1. Configurar nodemailer para Emails

1. Crea una cuenta de Gmail (o usa una existente)
2. Activa la verificación en dos pasos (2FA)
3. Genera una contraseña de aplicación en [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Agrega a `.env.production.local`:
   ```env
   GMAIL_USER=tu_email@gmail.com
   GMAIL_PASS=tu_contraseña_de_aplicacion
   ```

### 2. Variables de Entorno

Crea un archivo `.env.production.local` con:

```env
# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI (para el worker)
OPENAI_API_KEY=...

# nodemailer (Gmail)
GMAIL_USER=tu_email@gmail.com
GMAIL_PASS=tu_contraseña_de_aplicacion

# URL de la app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### 3. Deploy en Vercel

1. **Conecta tu repositorio**
2. **Importa en Vercel**
3. **Configura las variables de entorno**
4. **Deploy**

### 4. Verificar el Worker

El worker ya está deployado en Render. Verifica que esté funcionando:

1. Ve al dashboard de Render
2. Revisa los logs del worker
3. Asegúrate de que esté en estado "Running"

### 5. Configurar Dominio Personalizado (Opcional)

En Vercel:
1. Ve a Settings → Domains
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones

## ✅ Checklist de Verificación

- [ ] Worker de transcripción ejecutándose en Render
- [ ] Variables de entorno en Vercel
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
- Verifica que las variables de entorno estén configuradas
- Revisa los logs en Vercel Functions

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
- **Emails**: Gmail
- **Base de datos**: Dashboard de Supabase para queries

## 🎉 ¡Listo!

Tu aplicación SkillzaPro está ahora en producción con:
- ✅ Envío real de emails (Gmail/nodemailer)
- ✅ Transcripción automática de videos
- ✅ Sistema completo de entrevistas

Para soporte o preguntas, revisa la documentación o contacta al equipo de desarrollo. 