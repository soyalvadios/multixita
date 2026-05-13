const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const JWT_SECRET  = process.env.JWT_SECRET || 'multixita_secret_2026_umb';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body;
  if (!identificador || !password)
    return res.status(400).json({ error: 'Identificador y contraseña requeridos' });

  try {
    const [rows] = await db.query(
      `SELECT u.*,
        (SELECT vi.motivo_rechazo
         FROM verificaciones_identidad vi
         WHERE vi.id_usuario = u.id_usuario
         ORDER BY vi.id DESC LIMIT 1) AS motivo_rechazo
       FROM usuarios u
       WHERE u.matricula = ? OR u.badge = ?
       LIMIT 1`,
      [identificador, identificador]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    const ok   = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const payload = {
      id_usuario:           user.id_usuario,
      rol:                  user.rol,
      nombre:               user.nombre,
      apellido_paterno:     user.apellido_paterno,
      matricula:            user.matricula,
      badge:                user.badge,
      activo:               user.activo,
      identidad_verificada: user.identidad_verificada,
      estado_verificacion_facial: user.estado_verificacion_facial,
    };

    const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const usuario = {
      ...payload,
      carrera:        user.carrera,
      grupo:          user.grupo,
      ues:            user.ues,
      foto:           user.foto,
      foto_selfie:    user.foto_selfie,
      motivo_rechazo: user.motivo_rechazo,
    };

    res.json({ token, usuario });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/registro ───────────────────────────────
router.post('/registro', async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, matricula, password, ues, carrera, grupo } = req.body;

  if (!nombre || !apellido_paterno || !apellido_materno || !matricula || !password)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });

  try {
    const [existe] = await db.query(
      'SELECT id_usuario FROM usuarios WHERE matricula = ?',
      [matricula]
    );

    if (existe.length)
      return res.status(409).json({ error: 'La matrícula ya está registrada' });

    const hash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO usuarios
       (rol, nombre, apellido_paterno, apellido_materno, matricula, password,
        ues, carrera, grupo, activo, identidad_verificada, estado_verificacion_facial)
       VALUES ('alumno',?,?,?,?,?,'UES Temascalcingo',?,?,0,0,'sin_selfie')`,
      [nombre, apellido_paterno, apellido_materno, matricula, hash, carrera || null, grupo || null]
    );

    const id_usuario = result.insertId;

    // 🔥 GENERAR TOKEN TEMPORAL
    const token = jwt.sign(
      { id_usuario, rol: 'alumno' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      id_usuario,
      token
    });

  } catch (err) {
    console.error('Registro error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/admin/reset-password ──────────────────
router.post('/admin/reset-password', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol))
    return res.status(403).json({ error: 'Sin permisos' });
  const { matricula, nueva_password } = req.body;
  if (!matricula || !nueva_password || nueva_password.length < 6)
    return res.status(400).json({ error: 'Datos inválidos' });
  try {
    const hash = await bcrypt.hash(nueva_password, 12);
    await db.query('UPDATE usuarios SET password = ? WHERE matricula = ?', [hash, matricula]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── POST /api/auth/subir-selfie ───────────────────────────
// Multer local para este endpoint — guarda en uploads/fotos/
// con ruta absoluta para que express.static la sirva correctamente.
const multer = require('multer');
const fsSync = require('fs');
const pathMod = require('path');

const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = pathMod.join(__dirname, '../../uploads/fotos');
    fsSync.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const mat = req.usuario?.matricula || 'tmp';
    cb(null, `selfie_${mat}_${Date.now()}.jpg`);
  },
});
const uploadSelfie = multer({ storage: selfieStorage, limits: { fileSize: 8 * 1024 * 1024 } });

router.post('/subir-selfie', verifyToken, uploadSelfie.single('selfie'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
  // Ruta con slash inicial para que buildUri del frontend la concatene bien
  const ruta = `/uploads/fotos/${req.file.filename}`;
  try {
    await db.query(
      `UPDATE usuarios SET foto_selfie = ?, estado_verificacion_facial = 'pendiente' WHERE id_usuario = ?`,
      [ruta, req.usuario.id_usuario]
    );
    res.json({ ruta, estado_verificacion_facial: 'pendiente' });
  } catch (err) {
    console.error('Error subir selfie:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
