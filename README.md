# MultiXita — Acceso UMB 🏫
## Sistema móvil de gestión académica y control de acceso · UES Temascalcingo

MultiXita es una aplicación móvil para la UES Temascalcingo que centraliza login por rol, registro de alumnos, verificación de identidad, credencial digital con QR, control de acceso vehicular, boleta, tutorías, panel administrativo, panel docente y panel de caseta.

> Estado actual del proyecto: app móvil Expo + backend Node/Express + base de datos MySQL.  
> El panel web ya no es prioridad. La lógica principal vive en la app móvil y el backend.

---

## Estado actual importante

### Ya funciona ✅

- Backend Express corriendo en `http://localhost:3000`.
- Login por roles.
- Admin/coordinador puede ver accesos y alumnos.
- Oficial puede buscar alumno por matrícula y registrar entrada/salida.
- Endpoint `/api/oficial/dentro` devuelve alumnos dentro del campus.
- Alumno David `26230013` existe, activo=1, identidad_verificada=1.
- QR en caseta funcionando con `expo-camera` / `CameraView`.
- Logout limpia sesión y resetea navegación a Login sin back.
- **Flujo de registro completo**: Registro → Credencial frente → Credencial reverso → Selfie → CuentaPendiente.
- **Apellido materno obligatorio** en RegistroScreen (label, placeholder y validación).
- **Sesión no se activa durante registro**: se usa `tokenTemporal` de `route.params` hasta completar selfie.
- **CuentaPendienteScreen**: botón "Cerrar sesión" llama `logout()` + `CommonActions.reset` a Login.
- **Selfie del alumno visible en panel admin**: se guarda en `uploads/fotos/` con ruta `/uploads/fotos/archivo.jpg`.
- **Subir acta PDF desde panel docente**: extrae calificaciones automáticamente con `pdf2json`.
- **Boleta del alumno**: admin ve calificaciones por materia y parcial en `CoordinadorAlumnoDetalle`.
- **ngrok-skip-browser-warning** configurado para que las imágenes carguen correctamente vía ngrok.

### Bugs resueltos en esta sesión 🔧

1. ~~RegistroScreen: apellido materno opcional~~ → **Obligatorio con validación**
2. ~~Flujo de registro cortaba en frente y mandaba a CuentaPendiente~~ → **Flujo completo corregido**
3. ~~Login se activaba durante registro~~ → **Usa tokenTemporal, no activa sesión hasta selfie**
4. ~~CuentaPendienteScreen: botón cerrar sesión no hacía nada~~ → **Corregido con CommonActions.reset**
5. ~~Selfie no aparecía en panel admin (gris)~~ → **Resuelto: ruta correcta + endpoint correcto**
6. ~~Endpoint `/api/auth/subir-selfie` duplicado en auth.routes.js interceptaba antes que app.js~~ → **Eliminado duplicado, único endpoint en auth.routes.js**
7. ~~pdftotext no disponible en Windows~~ → **Reemplazado por pdf2json (puro Node.js)**

### Pendiente / por hacer 📋

- Encriptación de datos sensibles (nombres, matrícula, fotos) antes de producción
- HTTPS con certificado SSL en servidor de producción
- Configuración de firewall en servidor (MySQL solo localhost)
- Backups automáticos de la base de datos
- Panel alumno: validar boleta y tutorías completamente
- Admin pendientes: verificar contador/lista
- Panel docente: funciona parcialmente (tutorías)
- Historial accesos: puede dar 403 si token/rol no corresponde

---

## Estructura del proyecto

```text
multixita/
├── sql/
│   └── multixita_fresh.sql
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── config/db.js
│       ├── middlewares/auth.js
│       └── routes/
│           ├── auth.routes.js
│           └── tutorias.routes.js   ← incluye endpoint subir-acta PDF
└── app/
    ├── app.json
    ├── package.json
    ├── App.js
    ├── context/
    │   └── AuthContext.js
    ├── services/
    │   └── api.js
    ├── data/
    │   └── uesTemascalcingo.js
    └── screens/
        ├── LoginScreen.js
        ├── RegistroScreen.js           ← apellido materno obligatorio
        ├── SubirCredencialScreen.js    ← frente → reverso, sin activar sesión
        ├── SelfieScreen.js             ← tokenTemporal de route.params
        ├── CuentaPendienteScreen.js    ← logout() + CommonActions.reset
        ├── OficialScreen.js
        ├── HistorialAccesosScreen.js
        ├── CoordinadorTabs.js
        ├── CoordinadorAlumnoDetalle.js ← boleta con calificaciones por parcial
        ├── DocenteTabs.js              ← tab Calificaciones agregado
        ├── DocenteSubirActa.js         ← nuevo: subir acta PDF
        └── AlumnoTabs.js
```

---

## Tecnologías actuales

| Capa | Tecnología |
|---|---|
| App móvil | Expo SDK 54 |
| UI móvil | React Native |
| React | React 19.1 |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| Autenticación | JWT + SecureStore |
| Cámara/QR | expo-camera / CameraView |
| Imágenes | expo-image-picker |
| QR alumno | react-native-qrcode-svg |
| PDF parser | pdf2json |
| Túnel pruebas | ngrok |

---

## Instalación rápida

### 1. Base de datos

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS acceso_umb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p acceso_umb < sql/multixita_fresh.sql
```

Agregar índice único para calificaciones (necesario para ON DUPLICATE KEY UPDATE):

```sql
ALTER TABLE calificaciones
  ADD UNIQUE KEY unico_calificacion (id_alumno, id_asignacion, parcial);
```

---

### 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

En `.env`, configurar:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD
DB_NAME=acceso_umb
PORT=3000
JWT_SECRET=multixita_secret
```

Dependencias clave del backend:
```bash
npm install pdf2json   # parser de actas PDF (ya incluido)
```

Probar salud:
```
http://localhost:3000/api/health
```

---

### 3. ngrok

```bash
ngrok http 3000
```

Copiar la URL pública:
```
https://algo.ngrok-free.dev
```

El backend tiene configurado el header `ngrok-skip-browser-warning` en el middleware de archivos estáticos para que las imágenes carguen correctamente sin la pantalla de advertencia de ngrok.

---

### 4. Configurar app móvil

Editar `app/services/api.js`:

```js
export const BASE_URL = 'https://TU_URL_NGROK.ngrok-free.dev';
```

No poner `/api` al final.

---

### 5. App Expo

```bash
cd app
npm install
npx expo start -c
```

Si Expo Go marca incompatibilidad, asegurar SDK 54:

```bash
npm install expo@~54.0.0 react@19.1.0 react-native@0.81.5 --legacy-peer-deps
npx expo install --fix
npx expo install expo-camera expo-image-picker react-native-paper react-native-qrcode-svg react-native-worklets expo-document-picker
```

No usar `npm audit fix --force`.

---

## Flujo de registro de alumno (corregido)

```text
1. RegistroScreen
   → Valida nombre, apellido_paterno, apellido_materno (obligatorio), matrícula, password
   → POST /api/auth/registro → recibe { id_usuario, token } (tokenTemporal)
   → navigation.navigate('SubirCredencial', { tokenTemporal, id_usuario, matricula, password })
   → NO llama login() ni guardarSesion()

2. SubirCredencialScreen (paso=1: frente)
   → Usa tokenTemporal de route.params
   → POST /api/auth/subir-credencial-frente
   → setPaso(2) — NO navega a CuentaPendiente

3. SubirCredencialScreen (paso=2: reverso)
   → POST /api/auth/subir-credencial-reverso
   → navigation.replace('Selfie', { tokenTemporal, id_usuario })

4. SelfieScreen
   → Usa tokenTemporal de route.params
   → POST /api/auth/subir-selfie
   → navigation.replace('CuentaPendiente')

5. CuentaPendienteScreen
   → Botón "Cerrar sesión" → logout() + CommonActions.reset a Login
```

---

## Flujo de subida de acta PDF (docente)

```text
1. Panel docente → tab "Calificaciones" → DocenteSubirActa
2. Seleccionar PDF del acta SIDIUMB con expo-document-picker
3. POST /api/tutorias/docente/subir-acta (multipart/form-data)
4. Backend extrae texto con pdf2json
5. Parser identifica: parcial, clave materia, grupo, fecha, alumnos con calificaciones
6. INSERT ... ON DUPLICATE KEY UPDATE en tabla calificaciones
7. Registro en actas_pdf
8. Respuesta: resumen con actualizados y errores por matrícula
```

Nota: el campo `parcial` en el PDF de SIDIUMB aparece ANTES del texto "ACTA INTERNA PARCIAL" en el texto extraído por pdf2json (formato: `"1 ACTA INTERNA PARCIAL"`).

---

## Endpoints principales

```text
POST /api/auth/login
POST /api/auth/registro                     → devuelve { id_usuario, token }
POST /api/auth/subir-credencial-frente
POST /api/auth/subir-credencial-reverso
POST /api/auth/subir-selfie                 ← único en auth.routes.js

GET  /api/coordinador/alumnos
GET  /api/coordinador/accesos
POST /api/admin/aprobar/:id
POST /api/admin/rechazar/:id
POST /api/admin/crear-docente
GET  /api/admin/boleta/:id_alumno

GET  /api/oficial/buscar/:matricula
POST /api/oficial/entrada
PATCH /api/oficial/salida/:id_alumno
GET  /api/oficial/dentro
GET  /api/oficial/historial

GET  /api/alumnos/mis-calificaciones

GET  /api/tutorias/admin/materias
POST /api/tutorias/admin/crear-docente
GET  /api/tutorias/docente/asignaciones
GET  /api/tutorias/docente/mis-tutorias
POST /api/tutorias/docente/crear
PATCH /api/tutorias/docente/publicar/:id
PATCH /api/tutorias/docente/cerrar/:id
POST /api/tutorias/docente/subir-acta       ← nuevo: recibe PDF, extrae calificaciones
GET  /api/tutorias/alumno/mis-tutorias
POST /api/tutorias/alumno/responder/:id_ta

GET  /api/health
```

---

## Rutas de archivos en el servidor

```text
uploads/
├── fotos/          ← selfies de alumnos  (ruta en DB: /uploads/fotos/selfie_MAT_TS.jpg)
├── credenciales/   ← credenciales frente y reverso
│                      (ruta en DB: /uploads/credenciales/cred_frente_TS.jpg|cred_reverso_TS.jpg)
└── actas/          ← PDFs de actas subidos por docentes
```

Los archivos se sirven con:
```js
app.use('/uploads', (req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
}, express.static(path.join(__dirname, '../uploads')));
```

---

## Credenciales demo

| Rol | Identificador | Contraseña |
|---|---|---|
| Administrador | `admin001` | `123456` |
| Docente | `03271` | `123456` |
| Oficial | `CASETA01` | `123456` |
| Alumno David Alvarado | `26230013` | `123456` |
| Alumno Gabriel Arriaga | `26230026` | `123456` |
| Alumno Juan Beltrán | `26230057` | `123456` |
| Alumno Erick Contreras | `26230047` | `123456` |
| Alumno José García | `26230018` | `123456` |
| Alumno Magdalena Martínez | `26230021` | `123456` |
| Alumno Jocelyn Maya | `26230017` | `123456` |
| Alumno Yareli Núñez | `26230059` | `123456` |

---

## Módulos incluidos

| Módulo | Rol | Estado |
|---|---|---|
| Login | Todos | ✅ Funciona |
| Registro | Alumno | ✅ Flujo completo corregido |
| Subir credencial | Alumno | ✅ Frente → reverso → selfie |
| Selfie | Alumno | ✅ Usa tokenTemporal, navega a CuentaPendiente |
| Cuenta pendiente | Alumno | ✅ Logout correcto con reset |
| Panel alumno | Alumno | ⚠️ Funciona, seguir validando boleta/tutorías |
| Credencial QR | Alumno | ✅ QR dinámico funcionando |
| Boleta alumno | Alumno | ✅ Muestra parciales correctamente |
| Tutorías alumno | Alumno | ⚠️ Funciona parcialmente |
| Panel admin | Administrador | ✅ Funciona |
| Detalle alumno + fotos | Administrador | ✅ Selfie y credenciales visibles |
| Boleta en panel admin | Administrador | ✅ Calificaciones por materia y parcial |
| Admin pendientes | Administrador | ⚠️ Verificar contador/lista |
| Panel docente | Docente | ✅ Funciona con tab Calificaciones |
| Subir acta PDF | Docente | ✅ Extrae y registra calificaciones automáticamente |
| Panel caseta | Oficial | ✅ Entrada manual y QR funcionando |
| Historial accesos | Oficial | ⚠️ Puede dar 403 si token/rol no corresponde |

---

## Notas técnicas importantes

- La navegación depende del estado de autenticación (`token` y `usuario`), no solo de `navigation.navigate`.
- Al cerrar sesión: limpiar estado auth primero → borrar SecureStore → `CommonActions.reset` a Login.
- Para caseta: la entrada correcta usa `id_alumno`, aunque el alumno venga como `id_usuario`.
- Para vehículo: `alumnoEncontrado.vehiculos?.[0]?.id_vehiculo` o selector de vehículo.
- Para QR: usar `expo-camera` con `CameraView`.
- `foto_selfie` en DB guarda la ruta con slash inicial: `/uploads/fotos/archivo.jpg`.
- `foto_credencial` en DB guarda frente y reverso separados por `|`: `/uploads/credenciales/frente.jpg|/uploads/credenciales/reverso.jpg`.
- El endpoint `/api/auth/subir-selfie` vive **solo** en `auth.routes.js`. No duplicar en `app.js`.
- `pdf2json` extrae el texto con el número de parcial ANTES de "ACTA INTERNA PARCIAL".

---

## Consideraciones de seguridad para producción

- [ ] Configurar HTTPS con Let's Encrypt (gratis) en el servidor
- [ ] MySQL solo accesible desde localhost (no expuesto a internet)
- [ ] Firewall: solo puertos 80, 443 y SSH abiertos
- [ ] SSH con llave, no con contraseña
- [ ] Cambiar `JWT_SECRET` por una clave larga aleatoria
- [ ] Encriptar datos sensibles: nombres, matrícula (pendiente implementar)
- [ ] Acceso a fotos protegido por JWT (pendiente implementar)
- [ ] Backups automáticos de MySQL y carpeta `uploads/`
- [ ] `.env` nunca en el repositorio git (`.gitignore`)

---

## Prompt para abrir un nuevo chat

```text
Estoy trabajando en MultiXita, una app móvil Expo SDK 54 + backend Node/Express + MySQL para UES Temascalcingo.

LEE ESTE README como contexto. No cambies SDK, package.json ni rediseñes toda la app. Mantén estilo verde/blanco institucional.

Estado actual:
- Backend funciona en localhost:3000.
- Login por rol funciona.
- Flujo de registro completo: Registro → frente → reverso → selfie → CuentaPendiente.
  Usa tokenTemporal de route.params en SubirCredencialScreen y SelfieScreen. No llama login() durante registro.
- Selfie se guarda en uploads/fotos/ con ruta /uploads/fotos/archivo.jpg en DB.
- Credenciales se guardan en uploads/credenciales/, separadas por | en columna foto_credencial.
- Admin puede ver fotos y boleta del alumno en CoordinadorAlumnoDetalle.
- Docente puede subir acta PDF desde DocenteSubirActa (tab Calificaciones).
  El acta se parsea con pdf2json. El parcial aparece ANTES de "ACTA INTERNA PARCIAL" en el texto extraído.
- Calificaciones se insertan con ON DUPLICATE KEY UPDATE (requiere UNIQUE KEY en id_alumno+id_asignacion+parcial).
- QR de caseta funciona con expo-camera/CameraView.
- Logout: llama logout() de useAuth() + CommonActions.reset a Login.
- ngrok-skip-browser-warning configurado en express.static de uploads.
- El endpoint /api/auth/subir-selfie vive SOLO en auth.routes.js. No duplicar en app.js.

Pendiente principal: encriptación de datos sensibles y preparación para despliegue en servidor propio.
```

---

## Lógica KISS obligatoria

```text
Si alumno ya existe → regresar a Login.
Si alumno registra datos → pasar a foto credencial frente (con tokenTemporal).
Si sube frente → pasar a reverso (mismo screen, paso=2).
Si sube reverso → pasar a selfie (con tokenTemporal).
Si sube selfie → CuentaPendiente.
Si admin aprueba → cuenta activa.
Si admin rechaza → mostrar rechazo/motivo.
Si oficial registra entrada → volver al panel de caseta y refrescar lista.
Si oficial registra salida → volver al panel de caseta y refrescar lista.
Si usuario cierra sesión → logout() + CommonActions.reset a Login sin poder regresar con back.
Si docente sube acta PDF → extraer con pdf2json → insertar/actualizar calificaciones.
```

---

*Proyecto académico — UES Temascalcingo · UMB · MultiXita 2026*
