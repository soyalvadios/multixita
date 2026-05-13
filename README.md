# MultiXita 🎓📱

<p align="center">
  <img src="./assets/logo.png" width="220" alt="MultiXita Logo" />
</p>

<p align="center">
  Sistema móvil de gestión académica y control de acceso para instituciones educativas.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/React%20Native-Mobile-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/MySQL-Database-orange?style=for-the-badge&logo=mysql" />
</p>

---

# ✨ Características

* 🔐 Login por roles
* 🪪 Credencial digital con QR
* 🚪 Control de accesos
* 👨‍🏫 Panel docente
* 🛡️ Panel coordinador/admin
* 📚 Gestión de tutorías
* 📄 Subida y procesamiento de actas PDF
* 📸 Imágenes protegidas con JWT
* 🔄 OTA Updates con EAS Update
* ☁️ Backend desplegado en VPS Ubuntu con HTTPS

---

# 👥 Roles

* 🎓 Alumno
* 🚔 Oficial / Caseta
* 🛠️ Coordinador / Admin
* 👨‍🏫 Docente

---

# 🧱 Stack

## Mobile

* React Native
* Expo SDK 54
* Expo Updates
* React Navigation

## Backend

* Node.js
* Express
* MySQL
* JWT Authentication

## Infraestructura

* VPS Ubuntu
* HTTPS
* EAS Build
* EAS Update

---

# 📂 Estructura

```text
app/       -> aplicación móvil Expo
backend/   -> API REST y lógica del servidor
sql/       -> scripts SQL
```

---

# 🚀 Instalación

## Backend

```bash
cd backend
npm install
npm run dev
```

## App móvil

```bash
cd app
npm install
npx expo start --tunnel
```

---

# 📱 Testing

## Android

* APK preview instalada
* Updates OTA mediante:

```bash
eas update --channel preview --message "cambios"
```

## iOS

* Expo Go
* Ejecutar:

```bash
npx expo start --tunnel
```

---

# 🔐 Seguridad

* `/uploads` protegido con JWT
* Imágenes privadas autenticadas
* JWT expiración 24h
* Backend con validaciones de acceso
* Protección contra doble entrada/salida inválida

---

# 🛠️ Producción

Backend principal:

```text
https://multixita.bienmental.site
```

OTA Updates configurado con:

* `preview`
* `production`

---

# 📌 Estado del proyecto

🟢 Proyecto funcional y estable en desarrollo activo.

Prioridades actuales:

* estabilidad
* UX real
* bugs reales
* seguridad práctica

---

# 🎨 Arte / Identidad visual

Logo e identidad visual por:

## Salvador Arce

📸 Instagram:
[https://www.instagram.com/salvador_arce98/](https://www.instagram.com/salvador_arce98/)

---

# 👨‍💻 Autor

Desarrollado por David / soyalvadios.
