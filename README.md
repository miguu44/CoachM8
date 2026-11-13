# Pizarra Coach – Guía para principiantes (Firebase + Vercel, gratis)

## 1. Firebase (base de datos + login)
1. Entra en https://console.firebase.google.com con tu cuenta Google → **Crear un proyecto** (sin Analytics).
2. Menú **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Activar**.
3. **Compilación → Firestore Database → Crear base de datos** → región `eur3` (Europa) → modo producción.
4. Pestaña **Reglas** de Firestore: pega el contenido de `firestore.rules` → **Publicar**.
5. Rueda ⚙️ → **Configuración del proyecto** → "Tus apps" → icono `</>` (Web) → registra la app. Copia los valores `apiKey`, `authDomain`, `projectId`, `appId`.

## 2. Subir el código a GitHub
1. Crea cuenta en https://github.com → **New repository** (ej. `pizarra-coach`).
2. Descomprime el ZIP, y en el repo pulsa **Add file → Upload files**, arrastra TODO el contenido de la carpeta (no subas `.env`) → **Commit**.

## 3. Desplegar en Vercel
1. https://vercel.com → entra con GitHub → **Add New → Project** → importa `pizarra-coach`.
2. Framework: **Vite** (lo detecta solo). En **Environment Variables** añade:
   `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID` con los valores de Firebase.
3. **Deploy**. Obtendrás un enlace `https://pizarra-coach-xxx.vercel.app`.
4. Vuelve a Firebase → Authentication → **Configuración → Dominios autorizados** → añade ese dominio de Vercel.

## 4. Usarla
- Abre el enlace, pulsa **Crear cuenta** (mismo correo en PC y móvil = datos sincronizados al instante).
- **Android (Chrome):** menú ⋮ → *Instalar aplicación*. **iPhone (Safari):** Compartir → *Añadir a pantalla de inicio*.
- Funciona sin cobertura en el pabellón (caché offline); se sincroniza al volver la conexión.
- **IA:** pega tu API Key de Anthropic en la pestaña IA (se guarda solo en tu dispositivo) o usa "Copiar prompt listo".

## Probar en local (opcional)
`cp .env.example .env` (rellena valores) → `npm install` → `npm run dev`
