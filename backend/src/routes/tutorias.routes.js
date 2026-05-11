const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// ── Helpers ───────────────────────────────────────────────
async function generarFolio() {
  const y = new Date().getFullYear();
  const [[{ n }]] = await db.query(
    `SELECT COUNT(*) AS n FROM tutorias WHERE YEAR(fecha_publicacion) = ?`, [y]
  );
  return `TUT-${y}-${String(n + 1).padStart(3, '0')}`;
}

async function generarFolioConstancia() {
  const y = new Date().getFullYear();
  const [[{ n }]] = await db.query(
    `SELECT COUNT(*) AS n FROM constancias_tutoria WHERE YEAR(fecha_emision) = ?`, [y]
  );
  return `CONS-${y}-${String(n + 1).padStart(4, '0')}`;
}

// ═════════════════════════════════════════════════════
// ADMIN: crear docente con asignación
// ═════════════════════════════════════════════════════

// POST /api/tutorias/admin/crear-docente
router.post('/admin/crear-docente', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol))
    return res.status(403).json({ error: 'Sin permisos' });

  const { nombre, apellido_paterno, apellido_materno, badge, password,
          id_materia, id_grupo, id_periodo } = req.body;

  if (!nombre || !apellido_paterno || !badge || !password)
    return res.status(400).json({ error: 'Faltan campos: nombre, apellido_paterno, badge, password' });

  const bcrypt = require('bcrypt');
  try {
    // Verificar que badge no exista
    const [existe] = await db.query('SELECT id_usuario FROM usuarios WHERE badge = ?', [badge]);
    if (existe.length)
      return res.status(409).json({ error: 'El badge ya está registrado' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      `INSERT INTO usuarios (rol, nombre, apellido_paterno, apellido_materno, badge, password, activo)
       VALUES ('docente', ?, ?, ?, ?, ?, 1)`,
      [nombre, apellido_paterno, apellido_materno || null, badge, hash]
    );
    const id_docente = result.insertId;

    // Si se manda asignación, crearla
    let asignacion = null;
    if (id_materia && id_grupo && id_periodo) {
      const [asigResult] = await db.query(
        `INSERT IGNORE INTO asignaciones (id_docente, id_materia, id_grupo, id_periodo)
         VALUES (?, ?, ?, ?)`,
        [id_docente, id_materia, id_grupo, id_periodo]
      );
      asignacion = { id: asigResult.insertId || null, id_materia, id_grupo, id_periodo };
    }

    res.status(201).json({
      mensaje: 'Docente creado correctamente',
      id_docente,
      badge,
      asignacion,
    });
  } catch (err) {
    console.error('Error crear-docente:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/admin/materias  — para el formulario de creación de docente
router.get('/admin/materias', verifyToken, async (req, res) => {
  const roles = ['administrador','administrativo','coordinador'];
  if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [materias] = await db.query('SELECT id, clave, nombre FROM materias ORDER BY nombre');
    const [grupos]   = await db.query(`
      SELECT g.id, g.nombre, c.nombre AS carrera, p.nombre AS periodo
      FROM grupos g
      JOIN carreras c ON g.id_carrera = c.id
      JOIN periodos p ON g.id_periodo = p.id
      ORDER BY g.nombre`);
    const [periodos] = await db.query('SELECT id, nombre FROM periodos ORDER BY id DESC');
    res.json({ materias, grupos, periodos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/admin/resumen
router.get('/admin/resumen', verifyToken, async (req, res) => {
  const ok = ['administrador','administrativo','coordinador','docente'];
  if (!ok.includes(req.usuario.rol)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [[totales]] = await db.query(
      `SELECT
         COUNT(DISTINCT t.id)          AS total_tutorias,
         COUNT(ta.id)                  AS total_participantes,
         SUM(ta.estado = 'pendiente')  AS pendientes,
         SUM(ta.estado = 'respondida') AS respondidas,
         SUM(ta.nivel_riesgo = 'rojo')     AS riesgo_rojo,
         SUM(ta.nivel_riesgo = 'amarillo') AS riesgo_amarillo,
         SUM(ta.nivel_riesgo = 'verde')    AS riesgo_verde
       FROM tutorias t
       LEFT JOIN tutorias_alumnos ta ON ta.id_tutoria = t.id`
    );
    const [recientes] = await db.query(
      `SELECT t.id, t.folio, t.titulo, t.fecha_publicacion, t.estatus,
              m.nombre AS materia, g.nombre AS grupo, ud.nombre AS docente,
              COUNT(ta.id) AS alumnos, SUM(ta.estado='respondida') AS respondidas
       FROM tutorias t
       JOIN asignaciones a ON t.id_asignacion = a.id
       JOIN materias  m ON a.id_materia = m.id
       JOIN grupos    g ON a.id_grupo   = g.id
       JOIN usuarios ud ON t.id_docente = ud.id_usuario
       LEFT JOIN tutorias_alumnos ta ON ta.id_tutoria = t.id
       GROUP BY t.id ORDER BY t.fecha_publicacion DESC LIMIT 10`
    );
    res.json({ totales, recientes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════
// DOCENTE
// ═════════════════════════════════════════════════════

// GET /api/tutorias/docente/asignaciones
router.get('/docente/asignaciones', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT
         a.id AS id_asignacion,
         a.id_grupo,
         m.nombre  AS materia, m.clave AS clave_materia,
         g.nombre  AS grupo, p.nombre AS periodo, p.id AS id_periodo,
         (SELECT COUNT(*) FROM tutorias t
          WHERE t.id_asignacion = a.id AND t.estatus = 'publicada') AS tutorias_activas,
         (SELECT COUNT(*) FROM alumnos_grupos ag WHERE ag.id_grupo = a.id_grupo) AS total_alumnos
       FROM asignaciones a
       JOIN materias m ON a.id_materia = m.id
       JOIN grupos   g ON a.id_grupo   = g.id
       JOIN periodos p ON a.id_periodo = p.id
       WHERE a.id_docente = ?
       ORDER BY p.activo DESC, m.nombre`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/docente/mis-tutorias
router.get('/docente/mis-tutorias', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT
         t.id, t.folio, t.titulo, t.estatus, t.parcial,
         t.fecha_publicacion, t.fecha_cierre,
         m.nombre AS materia, m.clave AS clave_materia,
         g.nombre AS grupo, p.nombre AS periodo,
         COUNT(ta.id)                       AS total_alumnos,
         SUM(ta.estado = 'respondida')      AS respondidas,
         SUM(ta.nivel_riesgo = 'rojo')      AS riesgo_rojo,
         SUM(ta.nivel_riesgo = 'amarillo')  AS riesgo_amarillo,
         SUM(ta.nivel_riesgo = 'verde')     AS riesgo_verde,
         (SELECT COUNT(*) FROM tutoria_preguntas tp
          WHERE tp.id_tutoria = t.id AND tp.activa = 1) AS num_preguntas
       FROM tutorias t
       JOIN asignaciones a ON t.id_asignacion = a.id
       JOIN materias  m   ON a.id_materia = m.id
       JOIN grupos    g   ON a.id_grupo   = g.id
       JOIN periodos  p   ON a.id_periodo = p.id
       LEFT JOIN tutorias_alumnos ta ON ta.id_tutoria = t.id
       WHERE t.id_docente = ?
       GROUP BY t.id
       ORDER BY t.fecha_publicacion DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// POST /api/tutorias/docente/crear
router.post('/docente/crear', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente') return res.status(403).json({ error: 'Sin permisos' });
  const { id_asignacion, parcial, titulo, motivo, instrucciones, preguntas, estatus, alumnos_seleccionados } = req.body;

  if (!id_asignacion || !titulo)
    return res.status(400).json({ error: 'Faltan: id_asignacion, titulo' });
  if (!Array.isArray(preguntas) || preguntas.length === 0)
    return res.status(400).json({ error: 'La tutoría debe tener al menos una pregunta' });

  try {
    const [[asig]] = await db.query(
      `SELECT a.id, a.id_grupo, m.nombre AS materia, g.nombre AS grupo, p.nombre AS periodo
       FROM asignaciones a
       JOIN materias m ON a.id_materia = m.id
       JOIN grupos   g ON a.id_grupo   = g.id
       JOIN periodos p ON a.id_periodo = p.id
       WHERE a.id = ? AND a.id_docente = ?`,
      [id_asignacion, req.usuario.id_usuario]
    );
    if (!asig) return res.status(403).json({ error: 'Asignación no válida para este docente' });

    const folio       = await generarFolio();
    const estatusFinal = estatus === 'borrador' ? 'borrador' : 'publicada';

    const [tutResult] = await db.query(
      `INSERT INTO tutorias (folio, id_docente, id_asignacion, parcial, titulo, motivo, instrucciones, estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [folio, req.usuario.id_usuario, id_asignacion,
       parcial || 1, titulo, motivo || null, instrucciones || null, estatusFinal]
    );
    const id_tutoria = tutResult.insertId;

    // Insertar preguntas y opciones
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      if (!p.pregunta?.trim()) continue;
      const [pr] = await db.query(
        `INSERT INTO tutoria_preguntas (id_tutoria, orden, pregunta, tipo) VALUES (?, ?, ?, 'opcion_multiple')`,
        [id_tutoria, i + 1, p.pregunta.trim()]
      );
      for (let j = 0; j < (p.opciones || []).length; j++) {
        const op = p.opciones[j];
        if (!op.texto?.trim()) continue;
        await db.query(
          `INSERT INTO tutoria_opciones (id_pregunta, orden, texto, valor) VALUES (?, ?, ?, ?)`,
          [pr.insertId, j + 1, op.texto.trim(), op.valor ?? 0]
        );
      }
    }

    // Publicar a alumnos seleccionados o a todo el grupo si no es borrador
    let alumnos_notificados = 0;
    if (estatusFinal === 'publicada') {
      let destinatarios;
      if (Array.isArray(alumnos_seleccionados) && alumnos_seleccionados.length > 0) {
        // Solo los alumnos seleccionados por el docente (validados contra el grupo)
        const [validados] = await db.query(
          `SELECT ag.id_alumno FROM alumnos_grupos ag
           WHERE ag.id_grupo = ? AND ag.id_alumno IN (?)`,
          [asig.id_grupo, alumnos_seleccionados]
        );
        destinatarios = validados.map(a => a.id_alumno);
      } else {
        // Sin selección → publicar a todo el grupo (comportamiento original)
        const [todos] = await db.query(
          `SELECT ag.id_alumno FROM alumnos_grupos ag WHERE ag.id_grupo = ?`,
          [asig.id_grupo]
        );
        destinatarios = todos.map(a => a.id_alumno);
      }
      alumnos_notificados = destinatarios.length;
      if (destinatarios.length > 0) {
        const vals = destinatarios.map(id => [id_tutoria, id]);
        await db.query(`INSERT IGNORE INTO tutorias_alumnos (id_tutoria, id_alumno) VALUES ?`, [vals]);
      }
    }

    res.status(201).json({ id: id_tutoria, folio, estatus: estatusFinal, alumnos_notificados,
      materia: asig.materia, grupo: asig.grupo, periodo: asig.periodo });
  } catch (err) {
    console.error('Error crear tutoría:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tutorias/docente/publicar/:id
router.patch('/docente/publicar/:id', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [[tut]] = await db.query(
      `SELECT t.id, a.id_grupo FROM tutorias t JOIN asignaciones a ON t.id_asignacion = a.id
       WHERE t.id = ? AND t.id_docente = ?`,
      [req.params.id, req.usuario.id_usuario]
    );
    if (!tut) return res.status(404).json({ error: 'No encontrada' });

    await db.query(
      `UPDATE tutorias SET estatus = 'publicada', fecha_publicacion = NOW() WHERE id = ?`, [tut.id]
    );
    const [alumnos] = await db.query(
      `SELECT ag.id_alumno FROM alumnos_grupos ag WHERE ag.id_grupo = ?`, [tut.id_grupo]
    );
    if (alumnos.length) {
      await db.query(`INSERT IGNORE INTO tutorias_alumnos (id_tutoria, id_alumno) VALUES ?`,
        [alumnos.map(a => [tut.id, a.id_alumno])]);
    }
    res.json({ mensaje: 'Tutoría publicada', alumnos_notificados: alumnos.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tutorias/docente/cerrar/:id
router.patch('/docente/cerrar/:id', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    await db.query(
      `UPDATE tutorias SET estatus = 'cerrada', fecha_cierre = NOW() WHERE id = ? AND id_docente = ?`,
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensaje: 'Tutoría cerrada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tutorias/detalle/:id
router.get('/detalle/:id', verifyToken, async (req, res) => {
  try {
    const [[tut]] = await db.query(
      `SELECT t.*, m.nombre AS materia, m.clave AS clave_materia,
              g.nombre AS grupo, p.nombre AS periodo,
              ud.nombre AS docente_nombre, ud.apellido_paterno AS docente_ap
       FROM tutorias t
       JOIN asignaciones a ON t.id_asignacion = a.id
       JOIN materias  m ON a.id_materia = m.id
       JOIN grupos    g ON a.id_grupo   = g.id
       JOIN periodos  p ON a.id_periodo = p.id
       JOIN usuarios ud ON t.id_docente = ud.id_usuario
       WHERE t.id = ?`, [req.params.id]
    );
    if (!tut) return res.status(404).json({ error: 'No encontrada' });

    const [preguntas] = await db.query(
      `SELECT id, orden, pregunta, tipo FROM tutoria_preguntas
       WHERE id_tutoria = ? AND activa = 1 ORDER BY orden`, [req.params.id]
    );
    for (const p of preguntas) {
      const [ops] = await db.query(
        `SELECT id, orden, texto, valor FROM tutoria_opciones WHERE id_pregunta = ? ORDER BY orden`, [p.id]
      );
      p.opciones = ops;
    }

    const [alumnos] = await db.query(
      `SELECT ta.id AS id_tutoria_alumno, ta.id_alumno, ta.estado,
              ta.puntaje_total, ta.nivel_riesgo, ta.fecha_respuesta,
              u.nombre, u.apellido_paterno, u.matricula, u.foto, u.foto_selfie
       FROM tutorias_alumnos ta
       JOIN usuarios u ON ta.id_alumno = u.id_usuario
       WHERE ta.id_tutoria = ? ORDER BY u.apellido_paterno`, [req.params.id]
    );

    res.json({ ...tut, preguntas, alumnos });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════
// ALUMNO
// ═════════════════════════════════════════════════════

// GET /api/tutorias/alumno/mis-tutorias
router.get('/alumno/mis-tutorias', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         ta.id AS id_tutoria_alumno, ta.estado, ta.puntaje_total,
         ta.nivel_riesgo, ta.fecha_respuesta,
         t.id AS id_tutoria, t.folio, t.titulo, t.instrucciones,
         t.parcial, t.fecha_publicacion, t.estatus AS estatus_tutoria,
         m.nombre AS materia, m.clave AS clave_materia, g.nombre AS grupo,
         ud.nombre AS docente_nombre, ud.apellido_paterno AS docente_ap,
         (SELECT COUNT(*) FROM tutoria_preguntas tp
          WHERE tp.id_tutoria = t.id AND tp.activa = 1) AS num_preguntas,
         (SELECT ct.folio_constancia FROM constancias_tutoria ct
          WHERE ct.id_tutoria = t.id AND ct.id_alumno = ta.id_alumno LIMIT 1) AS folio_constancia
       FROM tutorias_alumnos ta
       JOIN tutorias     t  ON ta.id_tutoria   = t.id
       JOIN asignaciones a  ON t.id_asignacion = a.id
       JOIN materias     m  ON a.id_materia    = m.id
       JOIN grupos       g  ON a.id_grupo      = g.id
       JOIN usuarios     ud ON t.id_docente    = ud.id_usuario
       WHERE ta.id_alumno = ? AND t.estatus = 'publicada'
       ORDER BY t.fecha_publicacion DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/alumno/cuestionario/:id_ta
router.get('/alumno/cuestionario/:id_ta', verifyToken, async (req, res) => {
  try {
    const [[ta]] = await db.query(
      `SELECT id, id_alumno, id_tutoria, estado FROM tutorias_alumnos WHERE id = ?`,
      [req.params.id_ta]
    );
    if (!ta) return res.status(404).json({ error: 'No encontrado' });
    if (ta.id_alumno !== req.usuario.id_usuario)
      return res.status(403).json({ error: 'Sin permisos' });
    if (ta.estado === 'respondida')
      return res.status(409).json({ error: 'Ya respondiste esta tutoría' });

    const [preguntas] = await db.query(
      `SELECT id, orden, pregunta FROM tutoria_preguntas
       WHERE id_tutoria = ? AND activa = 1 ORDER BY orden`, [ta.id_tutoria]
    );
    for (const p of preguntas) {
      const [ops] = await db.query(
        `SELECT id, orden, texto, valor FROM tutoria_opciones WHERE id_pregunta = ? ORDER BY orden`, [p.id]
      );
      p.opciones = ops;
    }
    res.json({ id_tutoria_alumno: ta.id, preguntas });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});

// POST /api/tutorias/alumno/responder/:id_ta
router.post('/alumno/responder/:id_ta', verifyToken, async (req, res) => {
  const { respuestas } = req.body;
  if (!Array.isArray(respuestas) || !respuestas.length)
    return res.status(400).json({ error: 'Sin respuestas' });
  try {
    const [[ta]] = await db.query(
      `SELECT id, id_alumno, id_tutoria, estado FROM tutorias_alumnos WHERE id = ?`,
      [req.params.id_ta]
    );
    if (!ta) return res.status(404).json({ error: 'No encontrado' });
    if (ta.id_alumno !== req.usuario.id_usuario)
      return res.status(403).json({ error: 'Sin permisos' });
    if (ta.estado === 'respondida')
      return res.status(409).json({ error: 'Ya respondiste esta tutoría' });

    let puntaje = 0;
    for (const r of respuestas) {
      const [[op]] = await db.query(
        `SELECT id, valor, id_pregunta FROM tutoria_opciones WHERE id = ?`, [r.id_opcion]
      );
      if (op) {
        puntaje += op.valor || 0;
        await db.query(
          `INSERT INTO tutorias_respuestas (id_tutoria_alumno, id_opcion, id_pregunta, valor, opcion_texto)
           VALUES (?, ?, ?, ?, ?)`,
          [ta.id, op.id, op.id_pregunta, op.valor, r.texto_opcion || null]
        );
      }
    }

    // Calcular puntaje máximo posible
    const [[maxRow]] = await db.query(
      `SELECT SUM(max_val) AS max_total FROM (
         SELECT MAX(o.valor) AS max_val
         FROM tutoria_preguntas p
         JOIN tutoria_opciones o ON o.id_pregunta = p.id
         WHERE p.id_tutoria = ? AND p.activa = 1
         GROUP BY p.id
       ) AS m`, [ta.id_tutoria]
    );
    const maxTotal   = maxRow?.max_total || 100;
    const porcentaje = Math.round((puntaje / maxTotal) * 100);
    const nivel      = porcentaje >= 71 ? 'verde' : porcentaje >= 41 ? 'amarillo' : 'rojo';

    await db.query(
      `UPDATE tutorias_alumnos
       SET estado = 'respondida', puntaje_total = ?, nivel_riesgo = ?, fecha_respuesta = NOW()
       WHERE id = ?`,
      [porcentaje, nivel, ta.id]
    );

    const folioConstancia = await generarFolioConstancia();
    await db.query(
      `INSERT INTO constancias_tutoria (folio_constancia, id_tutoria, id_alumno, puntaje_final, nivel_riesgo)
       VALUES (?, ?, ?, ?, ?)`,
      [folioConstancia, ta.id_tutoria, ta.id_alumno, porcentaje, nivel]
    );

    res.json({ puntaje: porcentaje, nivel_riesgo: nivel, folio_constancia: folioConstancia });
  } catch (err) {
    console.error('Error responder:', err); res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/alumno/constancia/:folio
router.get('/alumno/constancia/:folio', verifyToken, async (req, res) => {
  try {
    const [[c]] = await db.query(
      `SELECT ct.folio_constancia, ct.puntaje_final, ct.nivel_riesgo, ct.fecha_emision,
              t.titulo, t.parcial,
              m.nombre AS materia, m.clave AS clave_materia, g.nombre AS grupo,
              ud.nombre AS docente_nombre, ud.apellido_paterno AS docente_ap,
              u.nombre AS alumno_nombre, u.apellido_paterno AS alumno_ap,
              u.apellido_materno AS alumno_am, u.matricula
       FROM constancias_tutoria ct
       JOIN tutorias     t  ON ct.id_tutoria = t.id
       JOIN asignaciones a  ON t.id_asignacion = a.id
       JOIN materias     m  ON a.id_materia = m.id
       JOIN grupos       g  ON a.id_grupo   = g.id
       JOIN usuarios     ud ON t.id_docente = ud.id_usuario
       JOIN usuarios     u  ON ct.id_alumno = u.id_usuario
       WHERE ct.folio_constancia = ? AND ct.id_alumno = ?`,
      [req.params.folio, req.usuario.id_usuario]
    );
    if (!c) return res.status(404).json({ error: 'Constancia no encontrada' });
    res.json(c);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────
// AGREGAR ESTE BLOQUE AL FINAL DE tutorias.routes.js
// JUSTO ANTES de // ═══════════════════════════════════════════════════════════════════════════
// NUEVOS ENDPOINTS — pegar en tutorias.routes.js ANTES de module.exports
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tutorias/docente/grupo/:id_grupo/alumnos
// Devuelve alumnos del grupo para que el docente seleccione a quiénes publicar
router.get('/docente/grupo/:id_grupo/alumnos', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente')
    return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [alumnos] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
              u.matricula, u.foto_selfie
       FROM alumnos_grupos ag
       JOIN usuarios u ON ag.id_alumno = u.id_usuario
       WHERE ag.id_grupo = ?
       ORDER BY u.apellido_paterno, u.nombre`,
      [req.params.id_grupo]
    );
    res.json(alumnos);
  } catch (err) {
    console.error('Error alumnos grupo:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tutorias/docente/publicar-seleccion/:id
// Publica una tutoría borrador solo para alumnos seleccionados
// Body: { alumnos_ids: [id1, id2, ...] }  — si vacío, publica a todo el grupo
router.patch('/docente/publicar-seleccion/:id', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente')
    return res.status(403).json({ error: 'Sin permisos' });

  const { alumnos_ids } = req.body; // array de id_usuario
  try {
    const [[tut]] = await db.query(
      `SELECT t.id, t.estatus, a.id_grupo
       FROM tutorias t
       JOIN asignaciones a ON t.id_asignacion = a.id
       WHERE t.id = ? AND t.id_docente = ?`,
      [req.params.id, req.usuario.id_usuario]
    );
    if (!tut) return res.status(404).json({ error: 'Tutoría no encontrada o sin permisos' });

    // Determinar alumnos destino
    let destinatarios;
    if (Array.isArray(alumnos_ids) && alumnos_ids.length > 0) {
      // Solo los seleccionados (verificar que pertenecen al grupo)
      const [validados] = await db.query(
        `SELECT ag.id_alumno
         FROM alumnos_grupos ag
         WHERE ag.id_grupo = ? AND ag.id_alumno IN (?)`,
        [tut.id_grupo, alumnos_ids]
      );
      destinatarios = validados.map(a => a.id_alumno);
    } else {
      // Todo el grupo
      const [todos] = await db.query(
        `SELECT ag.id_alumno FROM alumnos_grupos ag WHERE ag.id_grupo = ?`,
        [tut.id_grupo]
      );
      destinatarios = todos.map(a => a.id_alumno);
    }

    if (destinatarios.length === 0)
      return res.status(400).json({ error: 'No hay alumnos válidos para publicar' });

    // Insertar en tutorias_alumnos (IGNORE para no duplicar)
    const vals = destinatarios.map(id => [tut.id, id]);
    await db.query(
      `INSERT IGNORE INTO tutorias_alumnos (id_tutoria, id_alumno) VALUES ?`,
      [vals]
    );

    // Marcar tutoría como publicada
    await db.query(
      `UPDATE tutorias SET estatus = 'publicada' WHERE id = ?`,
      [tut.id]
    );

    res.json({ mensaje: 'Tutoría publicada', alumnos_notificados: destinatarios.length });
  } catch (err) {
    console.error('Error publicar selección:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tutorias/docente/reporte/:id_tutoria
// Reporte completo de una tutoría: alumnos, respuestas, puntajes y constancias
router.get('/docente/reporte/:id_tutoria', verifyToken, async (req, res) => {
  if (req.usuario.rol !== 'docente')
    return res.status(403).json({ error: 'Sin permisos' });
  try {
    // Verificar que la tutoría pertenece al docente
    const [[tut]] = await db.query(
      `SELECT t.id, t.folio, t.titulo, t.parcial, t.estatus,
              m.nombre AS materia, m.clave AS clave_materia,
              g.nombre AS grupo, p.nombre AS periodo,
              CONCAT(ud.nombre, ' ', ud.apellido_paterno) AS docente
       FROM tutorias t
       JOIN asignaciones a ON t.id_asignacion = a.id
       JOIN materias  m ON a.id_materia = m.id
       JOIN grupos    g ON a.id_grupo   = g.id
       JOIN periodos  p ON a.id_periodo = p.id
       JOIN usuarios ud ON t.id_docente = ud.id_usuario
       WHERE t.id = ? AND t.id_docente = ?`,
      [req.params.id_tutoria, req.usuario.id_usuario]
    );
    if (!tut) return res.status(404).json({ error: 'Tutoría no encontrada o sin permisos' });

    // Alumnos con su estado, puntaje, riesgo y folio de constancia
    const [alumnos] = await db.query(
      `SELECT ta.id AS id_tutoria_alumno,
              u.nombre, u.apellido_paterno, u.apellido_materno, u.matricula,
              ta.estado, ta.puntaje_total, ta.nivel_riesgo, ta.fecha_respuesta,
              ct.folio_constancia
       FROM tutorias_alumnos ta
       JOIN usuarios u ON ta.id_alumno = u.id_usuario
       LEFT JOIN constancias_tutoria ct
         ON ct.id_tutoria = ta.id_tutoria AND ct.id_alumno = ta.id_alumno
       WHERE ta.id_tutoria = ?
       ORDER BY u.apellido_paterno, u.nombre`,
      [req.params.id_tutoria]
    );

    // Estadísticas del reporte
    const total       = alumnos.length;
    const respondidas = alumnos.filter(a => a.estado === 'respondida').length;
    const pendientes  = total - respondidas;
    const porNivel    = alumnos.reduce((acc, a) => {
      if (a.nivel_riesgo) acc[a.nivel_riesgo] = (acc[a.nivel_riesgo] || 0) + 1;
      return acc;
    }, {});
    const promedio = respondidas > 0
      ? Math.round(alumnos.filter(a => a.puntaje_total != null)
          .reduce((s, a) => s + a.puntaje_total, 0) / respondidas)
      : null;

    res.json({
      tutoria: tut,
      estadisticas: { total, respondidas, pendientes, promedio, por_nivel: porNivel },
      alumnos,
    });
  } catch (err) {
    console.error('Error reporte:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
