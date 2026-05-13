// ─── ÚNICA fuente de verdad del servidor ──────────────────
// Cambia SOLO este valor:
//   LAN:   'http://192.168.X.X:3000'
//   ngrok: 'https://xxxx.ngrok-free.app'
export const BASE_URL = 'https://multixita.bienmental.site';

let authToken           = null;
let unauthorizedHandler = null;

export function setToken(t)             { authToken = t || null; }
export function clearToken()            { authToken = null; }
export function setUnauthorizedHandler(h) {
  unauthorizedHandler = typeof h === 'function' ? h : null;
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json().catch(() => ({}));
  const t = await res.text().catch(() => '');
  return t ? { message: t } : {};
}

export async function fetchAuth(path, options = {}, token, onExpired) {
  const tk = token || authToken;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (tk) headers.Authorization = `Bearer ${tk}`;
  const res  = await fetch(buildUrl(path), { ...options, headers });
  if (res.status === 401) {
    if (typeof onExpired === 'function') await onExpired();
    else if (unauthorizedHandler) await unauthorizedHandler();
    throw new Error('Sesión expirada');
  }
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

// ── Login — fetch aislado ──────────────────────────────────
export async function loginApi(identificador, password) {
  let res;
  try {
    res = await fetch(buildUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, password }),
    });
  } catch {
    throw new Error(`Sin conexión al servidor (${BASE_URL})`);
  }
  const data = await parseResponse(res);
  if (res.status === 401 || res.status === 400)
    throw new Error(data.error || 'Credenciales incorrectas');
  if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status})`);
  const token = data.token;
  // El backend puede mandar el usuario en data.usuario o en la raíz del objeto
  const usuario = data.usuario ?? {
    id_usuario:           data.id_usuario,
    nombre:               data.nombre,
    apellido_paterno:     data.apellido_paterno,
    apellido_materno:     data.apellido_materno,
    rol:                  data.rol,
    matricula:            data.matricula,
    badge:                data.badge,
    activo:               data.activo,
    identidad_verificada: data.identidad_verificada,
    carrera:              data.carrera,
    grupo:                data.grupo,
    ues:                  data.ues,
    correo:               data.correo,
  };
  if (!token)        throw new Error('Sin token en respuesta del servidor');
  if (!usuario?.rol) throw new Error('El servidor no devolvió el rol del usuario');
  console.log('[loginApi] rol recibido:', usuario.rol, '| activo:', usuario.activo, '| verificado:', usuario.identidad_verificada);
  return { token, usuario };
}

// ── Registro de alumno ─────────────────────────────────────
export async function registrarAlumno(datos) {
  let res;
  try {
    res = await fetch(buildUrl('/api/auth/registro'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  } catch { throw new Error(`Sin conexión al servidor (${BASE_URL})`); }
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Selfie ─────────────────────────────────────────────────
export async function subirSelfie(token, imageUri) {
  const form = new FormData();
  form.append('selfie', { uri: imageUri, type: 'image/jpeg', name: 'selfie.jpg' });
  const res = await fetch(buildUrl('/api/fotos/subir-selfie'), {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Coordinador / Admin ────────────────────────────────────
export const getAlumnos = (t, onExp) =>
  fetchAuth('/api/coordinador/alumnos', {}, t, onExp);
export const getAccesos = (t, onExp) =>
  fetchAuth('/api/coordinador/accesos', {}, t, onExp);
export const getBoleta = (t, id, onExp) =>
  fetchAuth(`/api/admin/boleta/${id}`, {}, t, onExp);
export const aprobarAlumno = (t, id, onExp) =>
  fetchAuth(`/api/admin/aprobar/${id}`, { method: 'POST' }, t, onExp);
export const rechazarAlumno = (t, id, motivo, onExp) =>
  fetchAuth(`/api/admin/rechazar/${id}`,
    { method: 'POST', body: JSON.stringify({ motivo }) }, t, onExp);
export const resetPasswordAdmin = (t, matricula, nueva_password, onExp) =>
  fetchAuth('/api/auth/admin/reset-password',
    { method: 'POST', body: JSON.stringify({ matricula, nueva_password }) }, t, onExp);
export const crearDocente = (t, payload, onExp) =>
  fetchAuth('/api/admin/crear-docente',
    { method: 'POST', body: JSON.stringify(payload) }, t, onExp);
export const getMateriasGrupos = (t, onExp) =>
  fetchAuth('/api/tutorias/admin/materias', {}, t, onExp);

// ── Oficial ────────────────────────────────────────────────
export const buscarAlumnoMatricula = (t, mat, onExp) =>
  fetchAuth(`/api/oficial/buscar/${encodeURIComponent(mat.trim())}`, {}, t, onExp);
export const registrarEntradaOficial = (t, datos, onExp) =>
  fetchAuth('/api/oficial/entrada', { method: 'POST', body: JSON.stringify(datos) }, t, onExp);
export const registrarSalidaOficial = (t, id, onExp) =>
  fetchAuth(`/api/oficial/salida/${id}`, { method: 'PATCH' }, t, onExp);
export const getOficialDentro = (t, onExp) =>
  fetchAuth('/api/oficial/dentro', {}, t, onExp);
export const getHistorialAccesos = (t, onExp) =>
  fetchAuth('/api/oficial/historial', {}, t, onExp);

// ── Tutorías ───────────────────────────────────────────────
export const getMisAsignacionesDocente = (t, onExp) =>
  fetchAuth('/api/tutorias/docente/asignaciones', {}, t, onExp);
export const getAlumnosGrupo = (t, id_grupo, onExp) =>
  fetchAuth(`/api/tutorias/docente/grupo/${id_grupo}/alumnos`, {}, t, onExp);
export const getMisTutoriasDocente = (t, onExp) =>
  fetchAuth('/api/tutorias/docente/mis-tutorias', {}, t, onExp);
export const crearTutoria = (t, datos, onExp) =>
  fetchAuth('/api/tutorias/docente/crear',
    { method: 'POST', body: JSON.stringify(datos) }, t, onExp);
export const publicarTutoriaBorrador = (t, id, onExp) =>
  fetchAuth(`/api/tutorias/docente/publicar/${id}`, { method: 'PATCH' }, t, onExp);
export const publicarTutoriaSeleccion = (t, id, alumnos_ids, onExp) =>
  fetchAuth(`/api/tutorias/docente/publicar-seleccion/${id}`,
    { method: 'PATCH', body: JSON.stringify({ alumnos_ids }) }, t, onExp);
export const cerrarTutoria = (t, id, onExp) =>
  fetchAuth(`/api/tutorias/docente/cerrar/${id}`, { method: 'PATCH' }, t, onExp);
export const getDetalleTutoria = (t, id, onExp) =>
  fetchAuth(`/api/tutorias/detalle/${id}`, {}, t, onExp);
export const getReporteTutoria = (t, id, onExp) =>
  fetchAuth(`/api/tutorias/docente/reporte/${id}`, {}, t, onExp);
export const getMisTutoriasAlumno = (t, onExp) =>
  fetchAuth('/api/tutorias/alumno/mis-tutorias', {}, t, onExp);
export const getCuestionario = (t, id_ta, onExp) =>
  fetchAuth(`/api/tutorias/alumno/cuestionario/${id_ta}`, {}, t, onExp);
export const responderCuestionario = (t, id_ta, respuestas, onExp) =>
  fetchAuth(`/api/tutorias/alumno/responder/${id_ta}`,
    { method: 'POST', body: JSON.stringify({ respuestas }) }, t, onExp);
export const getConstancia = (t, folio, onExp) =>
  fetchAuth(`/api/tutorias/alumno/constancia/${folio}`, {}, t, onExp);
// ── Perfil del alumno ──────────────────────────────────────
export const misVehiculos = (t, onExp) =>
  fetchAuth('/api/alumnos/mis-vehiculos', {}, t, onExp);

export const registrarVehiculo = (t, datos, onExp) =>
  fetchAuth('/api/alumnos/vehiculos',
    { method: 'POST', body: JSON.stringify(datos) }, t, onExp);

export const editarVehiculo = (t, id, datos, onExp) =>
  fetchAuth(`/api/alumnos/vehiculos/${id}`,
    { method: 'PATCH', body: JSON.stringify(datos) }, t, onExp);

export const miFoto = (t, onExp) =>
  fetchAuth('/api/alumnos/mi-foto', {}, t, onExp);

export async function subirFoto(token, formData) {
  const res = await fetch(buildUrl('/api/alumnos/foto'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const cambiarPassword = (t, datos, onExp) =>
  fetchAuth('/api/alumnos/cambiar-password',
    { method: 'POST', body: JSON.stringify(datos) }, t, onExp);

export function buildFileUrl(ruta) {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${BASE_URL.replace(/\/$/, '')}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

export const getResumenTutoriasAdmin = (t, onExp) =>
  fetchAuth('/api/tutorias/admin/resumen', {}, t, onExp);


export const registrarVehiculoOficial = (t, id_alumno, datos, onExp) =>
  fetchAuth(`/api/oficial/alumno/${id_alumno}/vehiculos`,
    { method: 'POST', body: JSON.stringify(datos) }, t, onExp);

