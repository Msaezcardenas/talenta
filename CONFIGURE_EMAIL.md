# 📧 Configuración de Envío de Emails

## Estado Actual

El sistema de envío de emails está configurado para funcionar con **nodemailer** y una cuenta de Gmail.

## Cómo Verificar el Envío

1. **Abre la terminal donde ejecutas `npm run dev` o `npm start`**
2. **Asigna candidatos a una entrevista**
3. **Verifica que no haya errores y que los emails lleguen a la bandeja de entrada o spam**

## Para Activar el Envío Real de Emails

1. Crea una cuenta de Gmail (o usa una existente)
2. Activa la verificación en dos pasos (2FA)
3. Genera una contraseña de aplicación en [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Agrega a `.env.local`:
   ```
   GMAIL_USER=tu_email@gmail.com
   GMAIL_PASS=tu_contraseña_de_aplicacion
   ```

## Troubleshooting

- Si el email no llega, revisa la carpeta de spam.
- Si ves errores de autenticación, revisa usuario y contraseña de aplicación.
- Si el error persiste, revisa los logs de la terminal para detalles.

## Nota

Ya no se usa Resend ni ningún otro proveedor externo. Todo el envío es directo vía Gmail y nodemailer. 