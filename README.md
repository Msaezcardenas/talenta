# Talium - Plataforma de Entrevistas Automatizadas

Sistema de entrevistas automatizadas con IA para facilitar el proceso de reclutamiento en RRHH, desarrollado con el branding de AgendaPro.

## Características

- 🎯 **Panel de administración** completo para gestionar entrevistas y candidatos
- 📊 **Dashboard** con estadísticas en tiempo real
- 👥 **Gestión de candidatos** con seguimiento de progreso
- 📝 **Creación de entrevistas** con preguntas de video, texto y opción múltiple
- 🔐 **Autenticación segura** con roles (admin/candidato)
- 📱 **Diseño responsive** optimizado para todos los dispositivos
- 🔗 **Magic Link** para candidatos - login sin contraseña
- 🎨 **Branding AgendaPro** con colores y diseño personalizado

## Tecnologías

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Lucide React para iconos
- **Estado**: React Hooks

## Configuración

### 1. Clonar el repositorio

```bash
git clone [tu-repositorio]
cd aplicacion_interview
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL proporcionado en `interview-ai-rules/supabase-setup.sql` en el SQL Editor de Supabase
3. Configura las políticas de Storage según las instrucciones en el archivo SQL

### 4. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) para ver el panel de administración.

## Estructura del proyecto

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx         # Layout principal del admin
│       └── dashboard/
│           └── page.tsx       # Página del dashboard
├── components/
│   └── admin/
│       ├── StatsCard.tsx      # Tarjetas de estadísticas
│       └── RecentActivityTable.tsx  # Tabla de actividad
├── lib/
│   ├── supabase/
│   │   └── client.ts          # Cliente de Supabase
│   └── types/
│       └── database.ts        # Tipos TypeScript
```

## Crear un usuario administrador

Después de que un usuario se registre, actualiza su rol en la base de datos:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@tuempresa.com';
```

## Próximos pasos

- [ ] Implementar página de gestión de candidatos
- [ ] Crear formulario para nuevas entrevistas
- [ ] Añadir funcionalidad de asignación de entrevistas
- [ ] Implementar vista de respuestas y evaluación
- [ ] Integrar procesamiento de videos con IA

## Licencia

MIT
