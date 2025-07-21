# 🔍 Verificar Entrega de Emails

## Los emails se están enviando pero no llegan

Según los logs, Resend está aceptando los emails (Status 200), pero pueden no estar llegando por estas razones:

## 1. Revisa SPAM/Correo no deseado 📧

**El 90% de los casos están aquí**. Busca en:
- Carpeta de Spam
- Correo no deseado
- Promociones (Gmail)
- Otros (Outlook)

## 2. Verifica en el Dashboard de Resend

1. Ve a [app.resend.com/emails](https://app.resend.com/emails)
2. Busca los emails enviados hace 1-2 horas
3. Revisa el estado:
   - ✅ **Delivered**: El email llegó al servidor del destinatario
   - ⏳ **Sent**: Resend lo envió pero aún no confirma entrega
   - ❌ **Bounced**: El email rebotó (dirección incorrecta)
   - 🚫 **Complained**: Marcado como spam

## 3. Problema: Usando dominio de prueba

Actualmente usas `onboarding@resend.dev` que es el dominio de prueba. Esto causa:
- Alta probabilidad de ir a SPAM
- Algunos proveedores lo bloquean
- No se ve profesional

### Solución: Configura tu propio dominio

1. En Resend, ve a **Domains** → **Add Domain**
2. Agrega tu dominio (ej: `tudominio.com`)
3. Configura los registros DNS que te indique Resend
4. Actualiza el código:

```typescript
// En src/app/api/send-interview-invitation/route.ts
from: 'Talium <noreply@tudominio.com>', // Tu dominio verificado
```

## 4. Verificar con el nuevo debug

Después del despliegue, el servidor mostrará:
```
📧 Respuesta de Resend: { data: { id: 'email_xxxxx' } }
```

Y el cliente recibirá:
```javascript
{
  success: true,
  message: "Invitación enviada correctamente",
  emailId: "email_xxxxx", // <-- ID para rastrear en Resend
  debug: {
    to: "destinatario@email.com",
    from: "onboarding@resend.dev",
    resendId: "email_xxxxx"
  }
}
```

Usa el `emailId` para buscar el email específico en el dashboard de Resend.

## 5. Límites de Resend (Plan Gratis)

- **100 emails/día**
- **3,000 emails/mes**

Si ves muchos logs de "/emails" con status 200, es posible que hayas usado varios emails hoy. Verifica en [app.resend.com/usage](https://app.resend.com/usage).

## 6. Prueba rápida

Envía un email de prueba directamente:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "tu-email@gmail.com",
    "subject": "Test Talium",
    "html": "<p>Este es un test</p>"
  }'
```

Si este llega pero los de la app no, el problema es en el código. Si este tampoco llega, es configuración de Resend o el destinatario. 