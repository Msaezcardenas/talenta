# TalentaPro

*Plataforma Profesional de Entrevistas para la Selección de Talento*

<img src="/public/next.svg" alt="TalentaPro logo" width="120" />

---

**TalentaPro** es una plataforma profesional de entrevistas que optimiza el proceso de selección de talento, ofreciendo a empresas y candidatos una experiencia profesional, eficiente y confiable.

## 🎨 Identidad Visual

La paleta de colores de TalentaPro se basa en tonos **profesionales y sobrios**:

- **Slate/Gris corporativo:** Transmite profesionalismo, confianza y estabilidad.
- **Azul empresarial:** Representa confianza, eficiencia y comunicación clara.
- **Tonos neutros:** Garantizan legibilidad y una experiencia visual limpia y profesional.
- **Diseño minimalista:** Inspirado en las mejores prácticas de UX empresarial, siguiendo estándares de plataformas profesionales reconocidas.

## 🚀 ¿Qué es TalentaPro?
TalentaPro es una plataforma profesional de entrevistas asincrónicas, diseñada para equipos de RRHH y candidatos. Permite:
- Crear entrevistas personalizadas (texto, video, selección múltiple)
- Asignar entrevistas a candidatos por email
- Recibir respuestas y transcripciones automáticas
- Analizar resultados desde un panel de administración intuitivo

---

## ✨ Principios de Usabilidad y UX
- **Sin fricción:** Los candidatos acceden con un solo click desde su email, sin registros ni contraseñas.
- **Feedback inmediato:** Toasts, validaciones visuales y mensajes claros en cada acción.
- **Accesibilidad:** Contraste alto, fuentes legibles (Poppins), navegación por teclado y diseño responsive.
- **Minimalismo:** Interfaz limpia, sin ruido visual, solo lo esencial para cada usuario.
- **Consistencia:** Colores, botones y componentes mantienen un look & feel profesional y moderno.

---

## 👩‍💼 Guía de Uso
### Para Administradores
1. **Login seguro:** Accede con tu email y contraseña de admin.
2. **Dashboard:** Visualiza estadísticas clave y entrevistas recientes.
3. **Crear Entrevistas:** Define preguntas de texto, video o selección múltiple.
4. **Asignar Entrevistas:** Selecciona una entrevista y asigna a uno o varios candidatos. Si el candidato no existe, créalo en el momento.
5. **Resultados:** Analiza respuestas, videos y transcripciones desde el panel.
6. **Notificaciones:** Recibe feedback visual inmediato de cada acción.

### Para Candidatos
- Recibe un email con un enlace único y seguro.
- Accede a la entrevista sin necesidad de registro.
- Responde preguntas de texto, video o selección múltiple.
- Recibe confirmación visual al completar la entrevista.

---

## 🛠️ Instalación y Despliegue

### Requisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com/)
- Cuenta de Gmail para envío de emails (o SMTP alternativo)
- (Opcional) Cuenta en Vercel para despliegue

### Instalación local
```bash
# Clona el repositorio
 git clone https://github.com/Msaezcardenas/SkillzaPro.git
cd SkillzaPro

# Instala dependencias
 npm install

# Configura variables de entorno
 cp .env.example .env.local
# Edita .env.local con tus claves de Supabase y Gmail

# Ejecuta en desarrollo
 npm run dev
```

### Despliegue en producción (Vercel recomendado)
- Sube el repo a GitHub
- Importa el proyecto en [Vercel](https://vercel.com/)
- Configura las variables de entorno en Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GMAIL_USER` y `GMAIL_PASS` (contraseña de aplicación)
  - `NEXT_PUBLIC_APP_URL` (URL de producción)
- Haz deploy y ¡listo!

---

## ⚙️ Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GMAIL_USER=...
GMAIL_PASS=...
NEXT_PUBLIC_APP_URL=...
```

---

## 🏗️ Arquitectura Técnica
- **Frontend & Backend:** Next.js 13+ (App Router, React Server/Client Components)
- **Base de datos:** Supabase (PostgreSQL, RLS, triggers, storage para videos)
- **Emails:** nodemailer + Gmail (o SMTP alternativo)
- **Transcripción de video:** Worker externo (FastAPI + Whisper/OpenAI)
- **UI:** Tailwind CSS, Poppins, Lucide Icons
- **Autenticación:** Supabase Auth (admin/candidato), RLS estricta
- **Notificaciones:** react-hot-toast
- **Despliegue:** Vercel (frontend/backend), Render (worker)

---

## 🔒 Seguridad y Buenas Prácticas
- **RLS en todas las tablas:** Solo admins pueden ver/crear candidatos, candidatos solo acceden a sus datos.
- **Service Role Key solo en backend:** Nunca expongas la service key en el frontend.
- **Validación de emails y formularios:** UX amigable y segura.
- **Enlaces únicos y expirables para candidatos.**
- **Contraseñas de aplicación para Gmail.**

---

## 👨‍💻 Créditos y Contacto
- **Desarrollo & Diseño:** Molu Sáez (github.com/Msaezcardenas)
- **UI/UX:** Inspirado en los mejores sistemas SaaS modernos.
- **Contacto:** soporte@skillzapro.com

---

## 📝 Licencia
MIT
