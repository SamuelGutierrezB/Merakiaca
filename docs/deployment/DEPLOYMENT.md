# 🚀 Guía de Deployment - Merakiaca

## ✅ Build Exitoso

El proyecto está listo para producción. Build optimizado con code-splitting:

- **vendor**: 240 KB - React, React Router
- **firebase**: 374 KB - Firebase SDK
- **forms**: 96 KB - React Hook Form, Zod
- **ui**: Iconos Heroicons
- **state**: Zustand
- **index**: 62 KB - Código de la aplicación

## 📦 Pasos para Deploy a Firebase Hosting

### 1. Instalar Firebase CLI (si no lo tienes)

```bash
npm install -g firebase-tools
```

### 2. Login a Firebase

```bash
firebase login
```

### 3. Inicializar Firebase (ya hecho)

El proyecto ya tiene `firebase.json` configurado.

### 4. Deploy

```bash
firebase deploy --only hosting
```

### 5. Verificar

Una vez deployado, tu app estará disponible en:

- **URL**: https://merakiaca-3a05a.web.app
- **O**: https://merakiaca-3a05a.firebaseapp.com

## 🔧 Configuración de Producción

### Variables de Entorno

El archivo `.env.production` ya está creado con las configuraciones necesarias.

**⚠️ Actualizar antes de deploy:**

- URLs de Mercado Pago (success/failure/pending) están configuradas para producción
- Agregar credenciales de Mercado Pago cuando estén listas

### Reglas de Firestore

Asegúrate de que las reglas de Firestore permitan:

- Lectura pública de productos activos
- Escritura solo para admins en productos
- Escritura de usuarios en carritos y órdenes

### Storage Rules

Configurar reglas para:

- Lectura pública de imágenes de productos
- Escritura solo para admins

## 📊 Optimizaciones Implementadas

✅ Code-splitting por dependencias
✅ Lazy loading de rutas
✅ Imágenes optimizadas
✅ CSS minificado (35 KB → 7 KB gzip)
✅ JS total: ~475 KB minificado, ~235 KB gzip

## 🔐 Administradores

Emails configurados como admin:

- samugutibarona@gmail.com
- merakiaca.c@gmail.com

Para agregar más admins:

1. Editar `.env` y `.env.production`
2. Agregar email en `VITE_ADMIN_EMAILS` (separado por comas)
3. Hacer rebuild y redeploy

## 🐛 Troubleshooting

### Si el deploy falla:

```bash
# Re-login
firebase logout
firebase login

# Seleccionar proyecto correcto
firebase use merakiaca-3a05a

# Intentar de nuevo
firebase deploy --only hosting
```

### Si hay errores 404 en rutas:

- Las rewrites en `firebase.json` ya están configuradas
- Todas las rutas redirigen a `/index.html` (SPA)

### Si Google Auth no funciona:

1. Ir a Firebase Console
2. Authentication > Sign-in method
3. Agregar dominio de producción en "Authorized domains"

## 🎉 Post-Deployment Checklist

- [ ] Verificar que la app carga correctamente
- [ ] Probar login con Google
- [ ] Verificar que admin panel funciona
- [ ] Crear/editar productos de prueba
- [ ] Probar carrito y checkout
- [ ] Verificar que las imágenes cargan
- [ ] Probar responsive en móvil
- [ ] Configurar dominio personalizado (opcional)
- [ ] Configurar SSL (automático en Firebase)

## 📱 Dominio Personalizado (Opcional)

Para usar un dominio personalizado:

```bash
firebase hosting:sites:create merakiaca
firebase target:apply hosting merakiaca merakiaca
```

Luego agregar el dominio en Firebase Console > Hosting > Add custom domain

---

**¿Listo para deployar?** Ejecuta:

```bash
npm run build && firebase deploy --only hosting
```
