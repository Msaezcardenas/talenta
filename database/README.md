# 🗄️ Database Migrations - TalentaPro

Esta carpeta contiene los scripts SQL necesarios para configurar la base de datos de **TalentaPro**.

## 📁 Archivos incluidos:

### `supabase-migrations.sql`
- **Propósito:** Estructura principal de la base de datos
- **Contiene:** Tablas, índices, relaciones y tokens de acceso
- **Cuándo usar:** Primera configuración de la base de datos

### `supabase-fix-policies.sql`
- **Propósito:** Políticas de seguridad y permisos
- **Contiene:** Reglas de acceso para usuarios y candidatos
- **Cuándo usar:** Después de crear las tablas principales

### `supabase-storage-policies.sql`
- **Propósito:** Configuración de almacenamiento de videos
- **Contiene:** Bucket de videos y permisos de archivos
- **Cuándo usar:** Para habilitar grabación de entrevistas

### `supabase-video-trigger.sql`
- **Propósito:** Procesamiento automático de videos
- **Contiene:** Triggers para transcripción con Whisper
- **Cuándo usar:** Para automatizar el procesamiento de respuestas

### `supabase-webhook-setup.sql`
- **Propósito:** Integración con servicios externos
- **Contiene:** Webhooks y notificaciones automáticas
- **Cuándo usar:** Para conectar con sistemas de email

## 🚀 Orden de ejecución:

```bash
1. supabase-migrations.sql      # Base
2. supabase-fix-policies.sql    # Seguridad
3. supabase-storage-policies.sql # Videos
4. supabase-video-trigger.sql   # Automatización
5. supabase-webhook-setup.sql   # Integraciones
```

## ⚠️ Importante:

- Estos scripts se ejecutan **UNA VEZ** durante el setup inicial
- En **producción**, la aplicación usa la configuración ya aplicada
- Mantener estos archivos como **documentación** y para **nuevos entornos**