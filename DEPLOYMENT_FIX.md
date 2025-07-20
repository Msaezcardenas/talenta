# 🚨 Configuración de Variables de Entorno en Vercel

El error indica que las variables de entorno de Supabase no están configuradas en Vercel.

## Pasos para solucionarlo:

### 1. Ve a tu Dashboard de Vercel
- Ingresa a [vercel.com](https://vercel.com)
- Selecciona tu proyecto "aplicacioninterview" o "Talium"

### 2. Configura las Variables de Entorno
- Ve a **Settings** → **Environment Variables**
- Agrega las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 3. Obtén estos valores de Supabase
- Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
- Ve a **Settings** → **API**
- Copia:
  - **Project URL** → pégalo en `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → pégalo en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Aplica las variables
- Después de agregar las variables, haz clic en **Save**
- Ve a **Deployments**
- Haz clic en los 3 puntos del último deployment
- Selecciona **Redeploy**

### 5. Variables opcionales (si las necesitas)
Si usas otras funcionalidades, también agrega:
```
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (si usas funciones del servidor)
OPENAI_API_KEY=tu_api_key (si usas transcripciones)
```

## ⚠️ Importante
- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el cliente
- NO expongas el `SERVICE_ROLE_KEY` al cliente
- Asegúrate de que las variables estén en los 3 entornos: Production, Preview, Development 