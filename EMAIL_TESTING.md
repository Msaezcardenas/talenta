# 📧 **Guía de Testing para Sistema de Emails**

## 🎯 **Objetivo**
Probar el sistema de envío de invitaciones por email antes del deploy a producción.

---

## 🧪 **Métodos de Testing**

### **1. Testing en Desarrollo (Local)**
El sistema automáticamente detecta modo desarrollo y simula el envío:

```bash
# 1. Ejecutar en local
npm run dev

# 2. Ir a: http://localhost:3000/admin/test-email

# 3. Ingresar tu email y probar
```

**Qué sucede:**
- ✅ No requiere credenciales de Gmail
- ✅ Simula el envío completo
- ✅ Muestra el email completo en la consola
- ✅ Genera el link de invitación correctamente

---

### **2. Testing con Gmail Real (Local)**

#### **Paso 1: Configurar Gmail**
```bash
# 1. Crear archivo .env.local
cp env.example .env.local

# 2. Configurar Gmail App Password
# Ve a: https://myaccount.google.com/apppasswords
# Genera una contraseña de aplicación
```

#### **Paso 2: Variables de Entorno**
```env
# .env.local
GMAIL_USER=tu_email@gmail.com
GMAIL_PASS=tu_app_password_de_16_digitos
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### **Paso 3: Probar**
```bash
# 1. Reiniciar servidor
npm run dev

# 2. Ir a: http://localhost:3000/admin/test-email
# 3. Probar con un email real
```

---

### **3. Testing en Vercel (Staging)**

#### **Paso 1: Deploy de Prueba**
```bash
# 1. Crear branch de testing
git checkout -b test-email-system

# 2. Push a Vercel
git push origin test-email-system
```

#### **Paso 2: Configurar Variables en Vercel**
1. Ve al panel de Vercel
2. Selecciona tu proyecto
3. Ve a Settings → Environment Variables
4. Agrega:
   ```
   GMAIL_USER=tu_email@gmail.com
   GMAIL_PASS=tu_app_password
   NEXT_PUBLIC_SITE_URL=https://tu-app.vercel.app
   ```

#### **Paso 3: Probar en Staging**
1. Ve a: `https://tu-app.vercel.app/admin/test-email`
2. Prueba con emails reales
3. Verifica que los emails lleguen correctamente

---

## 🔧 **Cómo Funciona el Sistema**

### **Detección Automática de Modo**
```javascript
// El sistema detecta automáticamente:
if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.NODE_ENV === 'development') {
  // Modo simulación
} else {
  // Modo real con Gmail
}
```

### **Endpoints Disponibles**

#### **1. Testing Endpoint**
```bash
POST /api/test-email
Body: { "testEmail": "test@example.com" }
```

#### **2. Email Real**
```bash
POST /api/send-interview-invitation
Body: {
  "assignmentId": "123",
  "candidateEmail": "candidate@example.com", 
  "candidateName": "Juan Pérez",
  "interviewTitle": "Entrevista Frontend",
  "token": "abc123"
}
```

---

## 📋 **Checklist de Testing**

### **✅ Desarrollo Local**
- [ ] Sistema simula emails sin credenciales
- [ ] Logs aparecen en consola
- [ ] Links se generan correctamente
- [ ] No hay errores en la API

### **✅ Gmail Real**
- [ ] Credenciales configuradas
- [ ] Emails se envían exitosamente
- [ ] Formato HTML se ve correcto
- [ ] Links funcionan correctamente
- [ ] No hay errores de autenticación

### **✅ Staging/Producción**
- [ ] Variables de entorno configuradas en Vercel
- [ ] Emails llegán a destinatarios reales
- [ ] Links redirigen correctamente
- [ ] Sistema responde sin errores

---

## 🚨 **Troubleshooting**

### **Error: "Invalid login"**
```bash
# Solución:
# 1. Verifica que uses App Password, no tu contraseña normal
# 2. Ve a: https://myaccount.google.com/apppasswords
# 3. Genera nueva contraseña de aplicación
```

### **Error: "Network timeout"**
```bash
# Solución:
# 1. Verifica conexión a internet
# 2. Revisa firewall/proxy
# 3. Prueba con otro email
```

### **Links no funcionan**
```bash
# Solución:
# 1. Verifica NEXT_PUBLIC_SITE_URL
# 2. Debe ser: https://tu-dominio.vercel.app
# 3. Sin slash final
```

---

## 🎉 **Flujo de Testing Recomendado**

### **Antes del Push a Main:**

1. **Test Local (Simulado)**
   ```bash
   npm run dev
   # Ve a /admin/test-email
   # Verifica que simula correctamente
   ```

2. **Test Local (Gmail Real)**
   ```bash
   # Configura .env.local con Gmail
   # Envía email a ti mismo
   # Verifica que llegue y funcione
   ```

3. **Test en Staging**
   ```bash
   # Deploy a branch de testing
   # Configura variables en Vercel
   # Prueba con diferentes emails
   ```

4. **Push a Main**
   ```bash
   # Solo cuando todos los tests pasen
   git checkout main
   git merge test-email-system
   git push origin main
   ```

---

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs en la consola del navegador
2. Revisa los logs del servidor en Vercel
3. Verifica las variables de entorno
4. Usa el endpoint `/api/test-email` para debugging

---

## 🔐 **Seguridad**

- ✅ Usa App Passwords de Gmail, nunca tu contraseña real
- ✅ No commitees credenciales al repo
- ✅ Usa variables de entorno en Vercel
- ✅ Genera tokens únicos para cada invitación