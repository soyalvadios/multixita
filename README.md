# MultiXita

Sistema móvil de gestión académica y control de acceso para instituciones educativas.

## Tecnologías

- React Native
- Expo
- Node.js
- Express
- MySQL

## Características

- Login por roles
- Credencial digital con QR
- Registro de alumnos
- Panel administrativo
- Panel docente
- Control de accesos
- Gestión de tutorías
- Subida y procesamiento de actas PDF

## Estructura

```text
app/       -> aplicación móvil
backend/   -> API y lógica del servidor
sql/       -> scripts de base de datos
```

## Instalación

### Backend

```bash
cd backend
npm install
npm run dev
```

### App móvil

```bash
cd app
npm install
npx expo start
```

## Variables de entorno

Crear archivo `.env` basado en `.env.example`.

## Estado

Proyecto académico en desarrollo.