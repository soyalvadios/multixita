export const UES_NOMBRE = 'UES Temascalcingo';
export const UES_CCT    = '15ESU0031B';

export const CARRERAS_UES = [
  { nombre: 'Informática',    prefijo: 'LF', grupos: ['26LF321','26LF361','26LF381','26LF351'] },
  { nombre: 'Psicología',     prefijo: 'LP', grupos: ['26LP321','26LP341','26LP361','26LP381'] },
  { nombre: 'Administración', prefijo: 'LA', grupos: ['26LA321','26LA341','26LA361','26LA381'] },
  { nombre: 'Logística',      prefijo: 'IL', grupos: ['26IL321','26IL341','26IL361','26IL381'] },
];

export function obtenerGruposPorCarrera(nombreCarrera) {
  const c = CARRERAS_UES.find(x => x.nombre.toLowerCase() === (nombreCarrera || '').toLowerCase());
  return c ? c.grupos : [];
}

export function validarGrupoCarrera(nombreCarrera, codigoGrupo) {
  const c = CARRERAS_UES.find(x => x.nombre.toLowerCase() === (nombreCarrera || '').toLowerCase());
  if (!c) return false;
  return (codigoGrupo || '').toUpperCase().includes(c.prefijo);
}

export function semestresDeGrupo(codigoGrupo) {
  if (!codigoGrupo || codigoGrupo.length < 5) return null;
  const sem = parseInt(codigoGrupo[4], 10);
  return isNaN(sem) ? null : sem;
}
