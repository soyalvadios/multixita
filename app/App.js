require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const multer  = require('multer');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const db      = require('./config/db');
const { verifyToken } = require('./middlewares/auth');

const app  = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Multer storage ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname.includes('selfie')
      ? path.join(__dirname, '../uploads/fotos')
      : path.join(__dirname, '../uploads/credenciales');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts  = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    const mat = req.usuario?.matricula || req.body?.matricula || 'tmp';
    const pre = file.fieldname.includes('selfie') ? `selfie_${mat}` : `cred_${file.fieldname}`;
    cb(null, `${pre}_${ts}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// ── Rutas externas ─────────────────────────────────────────
const authRoutes     = require('./routes/auth.routes');
const tutoriasRoutes = require('./routes/tutorias.routes');

app.use('/api/auth',     authRoutes);
app.use('/api/tutorias', tutoriasRoutes);

// ── Subir selfie ───────────────────────────────────────────
app.post('/api/fotos/subir-selfie', verifyToken,
  upload.single('selfie'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
    const ruta = `/uploads/fotos/${req.file.filename}`;
    try {
      await db.query(
        `UPDATE usuarios SET foto_selfie = ?, estado_verificacion_facial = 'pendiente' WHERE id_usuario = ?`,
        [ruta, req.usuario.id_usuario]
      );
      res.json({ ruta, estado_verificacion_facial: 'pendiente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// ── Subir credencial frente ────────────────────────────────
app.post('/api/auth/subir-credencial-frente', verifyToken,
  upload.single('frente'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
    const ruta = `/uploads/credenciales/${req.file.filename}`;
    try {
      const [[u]] = await db.query('SELECT foto_credencial FROM usuarios WHERE id_usuario = ?', [req.usuario.id_usuario]);
      const actual = u?.foto_credencial || '';
      const partes = actual.split('|');
      partes[0] = ruta;
      await db.query('UPDATE usuarios SET foto_credencial = ? WHERE id_usuario = ?', [partes.join('|'), req.usuario.id_usuario]);
      res.json({ ruta });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// ── Subir credencial reverso ───────────────────────────────
app.post('/api/auth/subir-credencial-reverso', verifyToken,
  upload.single('reverso'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
    const ruta = `/uploads/credenciales/${req.file.filename}`;
    try {
      const [[u]] = await db.query('SELECT foto_credencial FROM usuarios WHERE id_usuario = ?', [req.usuario.id_usuario]);
      const actual = u?.foto_credencial || '';
      const partes = actual.split('|');
      partes[1] = ruta;
      await db.query('UPDATE usuarios SET foto_credencial = ? WHERE id_usuario = ?', [partes.join('|'), req.usuario.id_usuario]);
      res.json({ ruta });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// ── GET foto de alumno ─────────────────────────────────────
app.get('/api/fotos/:filename', (req, res) => {
  const p = path.join(__dirname, '../uploads/fotos', req.params.filename);
  if (fs.existsSync(p)) res.sendFile(p);
  else res.status(404).json({ error: 'No encontrado' });
});

// ── COORDINADOR / ADMIN: alumnos ───────────────────────────
app.get('/api/coordinador/alumnos', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT id_usuario, nombre, apellido_paterno, apellido_materno, matricula,
              activo, identidad_verificada, estado_verificacion_facial,
              carrera, grupo, ues, foto, foto_selfie, foto_credencial,
              created_at, correo
       FROM usuarios WHERE rol = 'alumno'
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COORDINADOR / ADMIN: accesos ───────────────────────────
app.get('/api/coordinador/accesos', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador','oficial'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT r.id_registro, r.hora_entrada, r.hora_salida, r.tipo_acceso, r.estado, r.placas_vistas,
              u.nombre, u.apellido_paterno, u.matricula, u.foto, u.foto_selfie, u.carrera, u.grupo
       FROM registros_acceso r
       JOIN usuarios u ON r.id_alumno = u.id_usuario
       ORDER BY r.hora_entrada DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN: aprobar alumno ──────────────────────────────────
app.post('/api/admin/aprobar/:id', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    await db.query(
      `UPDATE usuarios SET activo = 1, identidad_verificada = 1,
       estado_verificacion_facial = 'aprobada' WHERE id_usuario = ?`,
      [req.params.id]
    );
    // Actualizar verificacion_identidad si existe fila
    await db.query(
      `UPDATE verificaciones_identidad SET estado = 'aprobado',
       revisado_por = ?, fecha_revision = NOW()
       WHERE id_usuario = ? AND id = (
         SELECT id FROM (SELECT id FROM verificaciones_identidad
          WHERE id_usuario = ? ORDER BY id DESC LIMIT 1) AS s)`,
      [req.usuario.id_usuario, req.params.id, req.params.id]
    ).catch(() => {}); // no fallar si no hay fila
    res.json({ mensaje: 'Alumno aprobado' });
  } catch (err) {
    console.error('Error aprobar:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: rechazar alumno ─────────────────────────────────
app.post('/api/admin/rechazar/:id', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  const { motivo } = req.body;
  try {
    await db.query(
      `UPDATE usuarios SET activo = 0, identidad_verificada = 0,
       estado_verificacion_facial = 'rechazada' WHERE id_usuario = ?`,
      [req.params.id]
    );
    await db.query(
      `UPDATE verificaciones_identidad SET estado = 'rechazado',
       revisado_por = ?, fecha_revision = NOW(), motivo_rechazo = ?
       WHERE id_usuario = ? AND id = (
         SELECT id FROM (SELECT id FROM verificaciones_identidad
          WHERE id_usuario = ? ORDER BY id DESC LIMIT 1) AS s)`,
      [req.usuario.id_usuario, motivo || null, req.params.id, req.params.id]
    ).catch(() => {});
    res.json({ mensaje: 'Verificación rechazada' });
  } catch (err) {
    console.error('Error rechazar:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: boleta de alumno ────────────────────────────────
app.get('/api/admin/boleta/:id_alumno', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [califs] = await db.query(
      `SELECT c.parcial, c.calificacion, c.asistencias, c.fecha_captura,
              m.nombre AS materia, m.clave AS clave_materia,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS docente
       FROM calificaciones c
       JOIN asignaciones a ON c.id_asignacion = a.id
       JOIN materias m     ON a.id_materia     = m.id
       JOIN usuarios u     ON a.id_docente     = u.id_usuario
       WHERE c.id_alumno = ?
       ORDER BY m.nombre, c.parcial`,
      [req.params.id_alumno]
    );
    res.json(califs);
  } catch (err) {
    console.error('Error boleta:', err);
    res.status(500).json({ error: err.message, detalle: err.message });
  }
});

// ── ALUMNO: mis calificaciones ────────────────────────────
app.get('/api/alumnos/mis-calificaciones', verifyToken, async (req, res) => {
  try {
    const [califs] = await db.query(
      `SELECT c.parcial, c.calificacion, c.asistencias, c.fecha_captura,
              m.nombre AS materia, m.clave AS clave_materia,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS docente
       FROM calificaciones c
       JOIN asignaciones a ON c.id_asignacion = a.id
       JOIN materias m     ON a.id_materia     = m.id
       JOIN usuarios u     ON a.id_docente     = u.id_usuario
       WHERE c.id_alumno = ?
       ORDER BY m.nombre, c.parcial`,
      [req.usuario.id_usuario]
    );
    res.json(califs);
  } catch (err) {
    console.error('Error mis-calificaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: crear docente ───────────────────────────────────
// (también manejado en tutorias.routes.js como /api/tutorias/admin/crear-docente)
app.post('/api/admin/crear-docente', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  const { nombre, apellido_paterno, apellido_materno, badge, password, id_materia, id_grupo, id_periodo } = req.body;
  if (!nombre || !apellido_paterno || !badge || !password)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    const [existe] = await db.query('SELECT id_usuario FROM usuarios WHERE badge = ?', [badge]);
    if (existe.length) return res.status(409).json({ error: 'Badge ya registrado' });
    const hash = await bcrypt.hash(password, 12);
    const [r]  = await db.query(
      `INSERT INTO usuarios (rol, nombre, apellido_paterno, apellido_materno, badge, password, activo)
       VALUES ('docente', ?, ?, ?, ?, ?, 1)`,
      [nombre, apellido_paterno, apellido_materno || null, badge, hash]
    );
    const id_docente = r.insertId;
    let asignacion = null;
    if (id_materia && id_grupo && id_periodo) {
      await db.query(
        `INSERT IGNORE INTO asignaciones (id_docente, id_materia, id_grupo, id_periodo) VALUES (?,?,?,?)`,
        [id_docente, id_materia, id_grupo, id_periodo]
      );
      const [[a]] = await db.query(
        `SELECT a.id, m.nombre AS materia, g.nombre AS grupo
         FROM asignaciones a JOIN materias m ON a.id_materia=m.id JOIN grupos g ON a.id_grupo=g.id
         WHERE a.id_docente = ? AND a.id_materia = ? AND a.id_grupo = ?`,
        [id_docente, id_materia, id_grupo]
      );
      asignacion = a;
    }
    res.status(201).json({ mensaje: 'Docente creado', id_docente, badge, asignacion });
  } catch (err) {
    console.error('Error crear-docente:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── OFICIAL: buscar alumno ────────────────────────────────
app.get('/api/oficial/buscar/:matricula', verifyToken, async (req, res) => {
  const roles = ['oficial','administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
              u.matricula, u.activo, u.identidad_verificada,
              u.estado_verificacion_facial, u.carrera, u.grupo, u.ues,
              u.foto, u.foto_selfie,
              v.id_vehiculo, v.placas, v.marca, v.modelo, v.color, v.tipo AS tipo_vehiculo
       FROM usuarios u
       LEFT JOIN vehiculos v ON v.id_usuario = u.id_usuario AND v.activo = 1
       WHERE u.matricula = ? AND u.rol = 'alumno'`,
      [req.params.matricula.trim()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alumno no encontrado' });
    const base    = rows[0];
    const alumno  = {
      id_usuario: base.id_usuario, nombre: base.nombre,
      apellido_paterno: base.apellido_paterno, apellido_materno: base.apellido_materno,
      matricula: base.matricula, activo: base.activo,
      identidad_verificada: base.identidad_verificada,
      estado_verificacion_facial: base.estado_verificacion_facial,
      carrera: base.carrera, grupo: base.grupo, ues: base.ues,
      foto: base.foto, foto_selfie: base.foto_selfie,
      vehiculos: rows.filter(r => r.id_vehiculo).map(r => ({
        id_vehiculo: r.id_vehiculo, placas: r.placas, marca: r.marca,
        modelo: r.modelo, color: r.color, tipo: r.tipo_vehiculo,
      })),
    };
    res.json(alumno);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ── OFICIAL: registrar entrada ────────────────────────────
app.post('/api/oficial/entrada', verifyToken, async (req, res) => {
  const roles = ['oficial','administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  const { id_alumno, id_vehiculo, placas_vistas } = req.body;
  if (!id_alumno) return res.status(400).json({ error: 'Falta id_alumno' });
  try {
    const [abiertos] = await db.query(
      `SELECT id_registro FROM registros_acceso
       WHERE id_alumno = ? AND hora_salida IS NULL ORDER BY hora_entrada DESC LIMIT 1`,
      [id_alumno]
    );
    if (abiertos.length)
      return res.status(409).json({ error: 'El alumno ya tiene una entrada activa' });
    const [r] = await db.query(
      `INSERT INTO registros_acceso (id_alumno, id_vehiculo, id_oficial, placas_vistas, tipo_acceso, estado)
       VALUES (?, ?, ?, ?, 'manual', 'dentro')`,
      [id_alumno, id_vehiculo || null, req.usuario.id_usuario, placas_vistas || null]
    );
    res.status(201).json({ mensaje: 'Entrada registrada', id_registro: r.insertId });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ── OFICIAL: registrar salida ─────────────────────────────
app.patch('/api/oficial/salida/:id_alumno', verifyToken, async (req, res) => {
  const roles = ['oficial','administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [abiertos] = await db.query(
      `SELECT id_registro FROM registros_acceso
       WHERE id_alumno = ? AND hora_salida IS NULL ORDER BY hora_entrada DESC LIMIT 1`,
      [req.params.id_alumno]
    );
    if (!abiertos.length) return res.status(404).json({ error: 'No hay entrada activa' });
    await db.query(
      `UPDATE registros_acceso SET hora_salida = NOW(), estado = 'salio' WHERE id_registro = ?`,
      [abiertos[0].id_registro]
    );
    res.json({ mensaje: 'Salida registrada' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ── OFICIAL: alumnos dentro ahora ────────────────────────
app.get('/api/oficial/dentro', verifyToken, async (req, res) => {
  const roles = ['oficial','administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [dentro] = await db.query(
      `SELECT r.id_registro, r.hora_entrada, r.placas_vistas, r.tipo_acceso,
              u.id_usuario, u.nombre, u.apellido_paterno, u.matricula,
              u.foto, u.foto_selfie, u.carrera, u.grupo,
              v.placas, v.marca, v.modelo, v.color
       FROM registros_acceso r
       JOIN usuarios u ON r.id_alumno = u.id_usuario
       LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
       WHERE r.hora_salida IS NULL AND r.estado = 'dentro'
       ORDER BY r.hora_entrada DESC`
    );
    const [[stats]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(tipo_acceso = 'nfc')    AS por_nfc,
              SUM(tipo_acceso = 'qr')     AS por_qr,
              SUM(tipo_acceso = 'manual') AS por_manual
       FROM registros_acceso
       WHERE hora_salida IS NULL AND estado = 'dentro'`
    );
    res.json({ dentro, stats });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ── OFICIAL: historial ────────────────────────────────────
app.get('/api/oficial/historial', verifyToken, async (req, res) => {
  const roles = ['oficial','administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT r.id_registro, r.hora_entrada, r.hora_salida, r.tipo_acceso, r.estado,
              u.nombre, u.apellido_paterno, u.matricula, u.foto, u.foto_selfie
       FROM registros_acceso r
       JOIN usuarios u ON r.id_alumno = u.id_usuario
       ORDER BY r.hora_entrada DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────
// ── ALUMNO: mis vehículos ─────────────────────────────────
app.get('/api/alumnos/mis-vehiculos', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_vehiculo, placas, marca, modelo, color, tipo, activo
       FROM vehiculos WHERE id_usuario = ? ORDER BY id_vehiculo DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALUMNO: registrar vehículo ────────────────────────────
app.post('/api/alumnos/vehiculos', verifyToken, async (req, res) => {
  const { placas, marca, modelo, color, tipo } = req.body;
  if (!placas || !color) return res.status(400).json({ error: 'Placas y color son obligatorios' });
  const tipoVal = ['auto','moto','otro'].includes(tipo) ? tipo : 'auto';
  try {
    const [existe] = await db.query('SELECT id_vehiculo FROM vehiculos WHERE placas = ?', [placas.trim().toUpperCase()]);
    if (existe.length) return res.status(409).json({ error: 'Esas placas ya están registradas' });
    const [r] = await db.query(
      `INSERT INTO vehiculos (id_usuario, placas, marca, modelo, color, tipo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, placas.trim().toUpperCase(), marca||null, modelo||null, color.trim(), tipoVal]
    );
    res.status(201).json({ mensaje: 'Vehículo registrado', id_vehiculo: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALUMNO: editar vehículo ───────────────────────────────
app.patch('/api/alumnos/vehiculos/:id', verifyToken, async (req, res) => {
  const { placas, marca, modelo, color, tipo } = req.body;
  const tipoVal = ['auto','moto','otro'].includes(tipo) ? tipo : 'auto';
  try {
    const [dueño] = await db.query(
      'SELECT id_vehiculo FROM vehiculos WHERE id_vehiculo = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (!dueño.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    await db.query(
      `UPDATE vehiculos SET placas=?, marca=?, modelo=?, color=?, tipo=? WHERE id_vehiculo=?`,
      [placas?.trim().toUpperCase(), marca||null, modelo||null, color?.trim(), tipoVal, req.params.id]
    );
    res.json({ mensaje: 'Vehículo actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALUMNO: mi foto de perfil ─────────────────────────────
app.get('/api/alumnos/mi-foto', verifyToken, async (req, res) => {
  try {
    const [[u]] = await db.query(
      'SELECT foto, foto_selfie FROM usuarios WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json({ foto: u?.foto || null, foto_selfie: u?.foto_selfie || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALUMNO: subir foto de perfil ──────────────────────────
app.post('/api/alumnos/foto', verifyToken, upload.single('foto'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
  const ruta = `/uploads/fotos/${req.file.filename}`;
  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id_usuario = ?', [ruta, req.usuario.id_usuario]);
    res.json({ ruta });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALUMNO: cambiar contraseña ────────────────────────────
app.post('/api/alumnos/cambiar-password', verifyToken, async (req, res) => {
  const { password_actual, password_nueva } = req.body;
  if (!password_actual || !password_nueva) return res.status(400).json({ error: 'Faltan campos' });
  if (password_nueva.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  try {
    const [[u]] = await db.query('SELECT password FROM usuarios WHERE id_usuario = ?', [req.usuario.id_usuario]);
    const ok = await bcrypt.compare(password_actual, u.password);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(password_nueva, 12);
    await db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, req.usuario.id_usuario]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.path}` }));

// ── Iniciar ───────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MultiXita backend corriendo en http://0.0.0.0:${PORT}`);
  console.log(`   Salud: http://localhost:${PORT}/api/health`);
});

module.exports = app;
