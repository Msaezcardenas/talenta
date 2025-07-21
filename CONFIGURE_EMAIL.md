# 📧 Configuración de Envío de Emails

## Estado Actual

El sistema de envío de emails está configurado pero actualmente funciona en **modo desarrollo**, lo que significa que los emails se muestran en la consola del servidor en lugar de enviarse realmente.

## Cómo Verificar el Envío

1. **Abre la terminal donde ejecutas `npm run dev`**
2. **Asigna candidatos a una entrevista**
3. **Busca en la consola los mensajes que empiezan con `📧`**
4. **Verás algo como esto:**

```
📧 Send invitation API called with: { assignmentId: '...', candidateEmail: '...', ... }
📧 Environment check: { hasResendKey: false, nodeEnv: 'development', ... }
📧 Running in development mode or no Resend API key
=== EMAIL SIMULADO ===
Para: candidato@email.com
Asunto: Invitación a Entrevista - Nombre de la Entrevista

Hola Juan Pérez,

Has sido seleccionado para participar en el proceso de entrevista para: Nombre de la Entrevista

Para acceder a tu entrevista, haz clic en el siguiente enlace:
http://localhost:3000/interview/123-456-789

Este enlace es único y personal. No lo compartas con nadie más.

Saludos,
Equipo de Talium
=== FIN EMAIL ===
```

## Para Activar el Envío Real de Emails

### Opción 1: Usar Resend (Recomendado)

1. **Crear cuenta en [Resend](https://resend.com)**
2. **Obtener tu API Key**
3. **Agregar a `.env.local`:**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Verificar tu dominio en Resend** (para producción)
5. **Actualizar el remitente en `src/app/api/send-interview-invitation/route.ts`:**
   ```typescript
   from: 'Talium <noreply@tudominio.com>', // Cambiar a tu dominio verificado
   ```

### Opción 2: Usar Otro Servicio

Si prefieres usar otro servicio como SendGrid, Mailgun, etc., necesitarás:

1. Modificar `src/app/api/send-interview-invitation/route.ts`
2. Instalar el SDK correspondiente
3. Configurar las credenciales en `.env.local`

## Modo de Desarrollo

Mientras no configures un servicio de email real:

- Los emails se mostrarán en la consola del servidor
- Los enlaces de invitación funcionarán normalmente
- Si algún "email" falla, se mostrará un modal con los enlaces para compartir manualmente

## Troubleshooting

### Los emails no aparecen en la consola

1. Asegúrate de estar mirando la terminal correcta (donde ejecutas `npm run dev`)
2. Busca mensajes que empiecen con `📧`
3. Revisa la consola del navegador (F12) para ver logs del cliente

### Error al enviar emails

1. Revisa que el API endpoint esté funcionando:
   ```bash
   curl -X POST http://localhost:3000/api/send-interview-invitation \
     -H "Content-Type: application/json" \
     -d '{"candidateEmail":"test@test.com","candidateName":"Test","interviewTitle":"Test","token":"123"}'
   ```

2. Verifica los logs del servidor para ver el error específico

### En producción no se envían

1. Verifica que `RESEND_API_KEY` esté configurada en las variables de entorno de producción
2. Asegúrate de que el dominio esté verificado en Resend
3. Revisa los logs de producción para errores 