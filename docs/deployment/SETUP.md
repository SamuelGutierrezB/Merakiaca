# 🚀 Configuración Inicial

## ✅ Completado hasta ahora:

- ✅ Estructura de carpetas completa
- ✅ Tipos TypeScript definidos
- ✅ Configuración de Firebase
- ✅ Sistema de autenticación con Google
- ✅ Stores de Zustand (auth y cart)
- ✅ React Router configurado
- ✅ Path aliases (`@/`) configurados
- ✅ Utilidades (formatters, validators, constants)

## 📋 Siguiente paso: Configurar Firebase

### 1. Crear proyecto en Firebase Console

1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto llamado "Merakiaca"
3. Activa Google Analytics (opcional)

### 2. Activar servicios necesarios

#### Authentication

- Ve a **Build > Authentication**
- Haz clic en "Get Started"
- En la pestaña "Sign-in method"
- Habilita **Google** como proveedor

#### Firestore Database

- Ve a **Build > Firestore Database**
- Haz clic en "Create database"
- Selecciona **production mode** (actualizaremos las reglas después)
- Elige la región más cercana a tus usuarios

#### Storage

- Ve a **Build > Storage**
- Haz clic en "Get started"
- Selecciona **production mode**

### 3. Obtener credenciales

1. Ve a **Project Settings** (ícono de engranaje)
2. En la sección "Your apps", crea una Web App
3. Copia las credenciales del `firebaseConfig`

### 4. Configurar variables de entorno

1. Copia `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

2. Llena las variables de Firebase con tus credenciales:

   ```env
   VITE_FIREBASE_API_KEY=tu_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=G-tu_measurement_id
   ```

3. Agrega tu email para ser admin:
   ```env
   VITE_ADMIN_EMAILS=tu-email@gmail.com
   ```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

## 🔥 Próximos pasos de desarrollo

Una vez que Firebase esté configurado, continuaremos con:

1. **Crear el Header/Layout** con navegación y menú
2. **Implementar página Home** con el contenido que ya tienes
3. **CRUD de Productos** en el admin
4. **Sistema de carga de imágenes**
5. **Catálogo de productos para clientes**

---

**Nota:** No subas el archivo `.env` a Git. Tus credenciales están protegidas en `.gitignore`.
