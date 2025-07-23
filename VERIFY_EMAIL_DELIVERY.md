# 🔍 Verificar Entrega de Emails

## Los emails se están enviando pero no llegan

- Revisa la carpeta de Spam/Correo no deseado/Promociones
- Verifica que las variables `GMAIL_USER` y `GMAIL_PASS` estén bien configuradas
- Revisa los logs del servidor para ver si hay errores de autenticación o conexión

## Verificar con Gmail

- Ingresa a tu cuenta de Gmail y revisa la bandeja de enviados
- Si el email aparece como enviado pero no llega, revisa la carpeta de spam del destinatario
- Si hay errores, revisa la terminal donde corres el servidor para detalles

## Troubleshooting

- Si ves errores de autenticación, genera una nueva contraseña de aplicación y actualiza `.env.local`
- Si el email no llega, prueba con otra cuenta de Gmail o revisa las restricciones de la cuenta

## Nota

Ya no se usa Resend ni ningún otro proveedor externo. Todo el envío es directo vía Gmail y nodemailer. 