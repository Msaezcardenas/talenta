# Instrucciones de Configuración

## 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

Para obtener estos valores:
1. Ve a tu proyecto en https://supabase.com/dashboard
2. Settings > API
3. Copia Project URL y anon key

## 2. Ejecutar Migraciones en Supabase

1. Ve al SQL Editor en tu dashboard de Supabase
2. Ejecuta primero el contenido de `supabase-setup.sql`
3. Luego ejecuta el contenido de `supabase-migrations.sql`

## 3. Crear Usuario Admin

1. Ve a Authentication > Users en Supabase
2. Crea un nuevo usuario con email y contraseña
3. En el SQL Editor, ejecuta:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
   ```

## 4. Iniciar el Proyecto

```bash
npm install
npm run dev
```

## 5. Acceder al Sistema

- Admin: http://localhost:3000/admin/login
- Candidatos: Usarán links únicos enviados por email

## Solución de Problemas

Si el login no funciona:
1. Verifica que las variables de entorno estén configuradas
2. Revisa la consola del navegador para ver los logs
3. Verifica que el usuario tenga rol 'admin' en la tabla profiles
4. Asegúrate de que las migraciones se ejecutaron correctamente 