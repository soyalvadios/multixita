import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { aprobarAlumno, buildFileUrl, getBoleta, rechazarAlumno, resetPasswordAdmin } from '../services/api';

const GREEN  = '#2E7D32';
const DARK   = '#1B5E20';

// Estados de verificación con colores claros
const ESTADO_VERIF = {
  aprobada:  { bg: '#E8F5E9', txt: '#1B5E20', icono: '✅', label: 'Aprobada' },
  pendiente: { bg: '#FFF8E1', txt: '#E65100', icono: '⏳', label: 'Pendiente revisión' },
  rechazada: { bg: '#FFEBEE', txt: '#C62828', icono: '❌', label: 'Rechazada' },
  sin_selfie:{ bg: '#F5F5F5', txt: '#757575', icono: '📷', label: 'Sin foto' },
};

// Partes granulares que puede rechazar el admin
const PARTES_RECHAZO = [
  { key: 'credencial', label: '📄 Credencial / documento' },
  { key: 'selfie',     label: '🤳 Foto de rostro (selfie)' },
  { key: 'datos',      label: '📋 Datos personales incorrectos' },
  { key: 'otro',       label: '📝 Otro motivo' },
];

function FotoCard({ titulo, uri, placeholder }) {
  return (
    <View style={s.fotoCard}>
      <Text style={s.fotoLabel}>{titulo}</Text>
      {uri ? (
        <Image source={{ uri }} style={s.fotoImg} resizeMode="cover" />
      ) : (
        <View style={s.fotoPlaceholder}>
          <Text style={s.fotoPlaceholderTxt}>{placeholder || 'Sin foto'}</Text>
        </View>
      )}
    </View>
  );
}

function buildUri(ruta) {
  if (!ruta) return null;
  if (ruta.startsWith('http')) return ruta;
  return `${BASE_URL}${ruta}`;  // ← concatena BASE_URL + ruta
}

export default function CoordinadorAlumnoDetalle({ route, navigation }) {
  const { alumno: alumnoInicial } = route.params;
  const { token, handleTokenExpired } = useAuth();
  const [alumno,        setAlumno]        = useState(alumnoInicial);
  const [boleta,        setBoleta]        = useState([]);
  const [boletaAbierta, setBoletaAbierta] = useState(false);
  const [cargaBoleta,   setCargaBoleta]   = useState(false);
  const [modalPass,     setModalPass]     = useState(false);
  const [modalRechazo,  setModalRechazo]  = useState(false);
  const [nuevaPass,     setNuevaPass]     = useState('');
  const [motivoTexto,   setMotivoTexto]   = useState('');
  const [parteSelec,    setParteSelec]    = useState('credencial');
  const [guardando,     setGuardando]     = useState(false);

  // URIs de fotos
  const fotoSelfieUri = buildUri(alumno?.foto_selfie || alumno?.foto, token);
  const credFrenteUri = buildUri(alumno?.foto_credencial?.split('|')[0], token);
  const credReversoUri= buildUri(alumno?.foto_credencial?.split('|')[1], token);

  const estadoVerif = ESTADO_VERIF[alumno?.estado_verificacion_facial] || ESTADO_VERIF.sin_selfie;

  const materias = useMemo(() => boleta.reduce((acc, c) => {
    const key = c.materia || 'Materia';
    if (!acc[key]) acc[key] = { materia: key, docente: c.docente, parciales: [] };
    acc[key].parciales.push(c);
    return acc;
  }, {}), [boleta]);

  const cargarBoleta = async () => {
    if (boletaAbierta) { setBoletaAbierta(false); return; }
    if (boleta.length) { setBoletaAbierta(true); return; }
    setCargaBoleta(true);
    try {
      const data = await getBoleta(token, alumno.id_usuario || alumno.id, handleTokenExpired);
      setBoleta(Array.isArray(data) ? data : []);
      setBoletaAbierta(true);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setCargaBoleta(false); }
  };

  const handleAprobar = () =>
    Alert.alert('Aprobar alumno', '¿Confirmas la aprobación de identidad completa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          setGuardando(true);
          try {
            await aprobarAlumno(token, alumno.id_usuario || alumno.id, handleTokenExpired);
            setAlumno(prev => ({
              ...prev,
              identidad_verificada: 1,
              estado_verificacion_facial: 'aprobada',
              activo: 1,
            }));
            Alert.alert('Aprobado', 'Alumno verificado y activado correctamente.');
          } catch (e) { Alert.alert('Error', e.message); }
          finally { setGuardando(false); }
        },
      },
    ]);

  const handleRechazar = async () => {
    const motivo = [
      PARTES_RECHAZO.find(p => p.key === parteSelec)?.label,
      motivoTexto.trim() ? `— ${motivoTexto.trim()}` : '',
    ].filter(Boolean).join(' ');

    setGuardando(true);
    try {
      await rechazarAlumno(token, alumno.id_usuario || alumno.id, motivo, handleTokenExpired);
      setAlumno(prev => ({
        ...prev,
        identidad_verificada: 0,
        estado_verificacion_facial: 'rechazada',
        activo: 0,
      }));
      setModalRechazo(false);
      setMotivoTexto('');
      Alert.alert('Rechazado', `Se notificó el motivo:\n${motivo}`);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  };

  const handleResetPass = async () => {
    if (nuevaPass.length < 6) { Alert.alert('Error', 'Mínimo 6 caracteres'); return; }
    setGuardando(true);
    try {
      await resetPasswordAdmin(token, alumno.matricula || alumno.badge, nuevaPass, handleTokenExpired);
      setModalPass(false);
      setNuevaPass('');
      Alert.alert('Listo', 'Contraseña actualizada correctamente.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Text style={s.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle del alumno</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── Datos del alumno ──────────────────────────── */}
        <View style={s.card}>
          <View style={s.alumnoRow}>
            {fotoSelfieUri ? (
              <Image source={{ uri: fotoSelfieUri }} style={s.photo} />
            ) : (
              <View style={[s.photo, s.photoFallback]}>
                <Text style={s.photoLetter}>{(alumno?.nombre || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{alumno?.nombre} {alumno?.apellido_paterno} {alumno?.apellido_materno || ''}</Text>
              <Text style={s.meta}>Matrícula: {alumno?.matricula || '—'}</Text>
              {!!alumno?.carrera && <Text style={s.meta}>Carrera: {alumno.carrera}</Text>}
              {!!alumno?.grupo   && <Text style={s.meta}>Grupo: {alumno.grupo}</Text>}
              {!!alumno?.correo  && <Text style={s.meta}>Correo: {alumno.correo}</Text>}
            </View>
          </View>
        </View>

        {/* ── Fotos de credencial y selfie ──────────────── */}
        <Text style={s.secLabel}>Documentos y fotografías</Text>
        <View style={s.card}>
          <View style={s.fotosRow}>
            <FotoCard titulo="Credencial (frente)" uri={credFrenteUri}  placeholder="Sin foto" />
            <FotoCard titulo="Credencial (reverso)" uri={credReversoUri} placeholder="Sin foto" />
          </View>
          <View style={s.fotosRow}>
            <FotoCard titulo="Selfie / Rostro" uri={fotoSelfieUri} placeholder="Sin selfie" />
            <View style={{ flex: 1 }} />
          </View>
        </View>

        {/* ── Estado de verificación ────────────────────── */}
        <Text style={s.secLabel}>Verificación de identidad</Text>
        <View style={s.card}>
          <View style={[s.estadoBadge, { backgroundColor: estadoVerif.bg }]}>
            <Text style={s.estadoIcono}>{estadoVerif.icono}</Text>
            <View>
              <Text style={[s.estadoLabel, { color: estadoVerif.txt }]}>{estadoVerif.label}</Text>
              <Text style={s.estadoSub}>
                Identidad: {alumno?.identidad_verificada ? 'Verificada' : 'No verificada'} ·
                Activo: {alumno?.activo ? 'Sí' : 'No'}
              </Text>
            </View>
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.btnAprobar, guardando && { opacity: 0.6 }]}
              onPress={handleAprobar}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnTxt}>✅ Aprobar identidad</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnRechazar, guardando && { opacity: 0.6 }]}
              onPress={() => setModalRechazo(true)}
              disabled={guardando}
            >
              <Text style={s.btnTxt}>❌ Rechazar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Boleta ────────────────────────────────────── */}
        <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={cargarBoleta}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>📊 Boleta de calificaciones</Text>
            {cargaBoleta
              ? <ActivityIndicator color={GREEN} size="small" />
              : <Text style={s.chevron}>{boletaAbierta ? 'Ocultar ▴' : 'Ver ▾'}</Text>
            }
          </View>
          {boletaAbierta && (
            <View style={{ marginTop: 12 }}>
              {Object.values(materias).length === 0 ? (
                <Text style={s.meta}>Sin calificaciones registradas.</Text>
              ) : Object.values(materias).map(m => (
                <View key={m.materia} style={s.gradeCard}>
                  <Text style={s.gradeTitle}>{m.materia}</Text>
                  {!!m.docente && <Text style={s.meta}>Docente: {m.docente}</Text>}
                  {m.parciales.map((p, idx) => (
                    <Text key={idx} style={s.meta}>
                      Parcial {p.parcial || idx + 1}: <Text style={{ fontWeight: '700' }}>{p.calificacion ?? '—'}</Text>
                      {p.asistencias ? ` · Asistencias: ${p.asistencias}` : ''}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* ── Cambiar contraseña ────────────────────────── */}
        <TouchableOpacity
          style={[s.btnSecundario, { marginBottom: 24 }]}
          onPress={() => setModalPass(true)}
        >
          <Text style={s.btnSecundarioTxt}>🔑 Cambiar contraseña</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modal: cambiar contraseña ─────────────────────────── */}
      <Modal visible={modalPass} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Nueva contraseña</Text>
            <TextInput
              style={s.modalInput}
              value={nuevaPass}
              onChangeText={setNuevaPass}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#aaa"
              secureTextEntry
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnPrimary} onPress={handleResetPass} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnTxt}>Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setModalPass(false)}>
                <Text style={s.modalBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: rechazo granular ────────────────────────────── */}
      <Modal visible={modalRechazo} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Qué parte se rechaza?</Text>
            <Text style={s.modalSub}>Selecciona la parte específica que no cumple:</Text>

            {PARTES_RECHAZO.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.parteBtn, parteSelec === p.key && s.parteBtnSel]}
                onPress={() => setParteSelec(p.key)}
              >
                <View style={[s.radio, parteSelec === p.key && s.radioSel]}>
                  {parteSelec === p.key && <View style={s.radioInner} />}
                </View>
                <Text style={[s.parteBtnTxt, parteSelec === p.key && { color: GREEN, fontWeight: '700' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={s.modalSub}>Detalles adicionales (opcional):</Text>
            <TextInput
              style={[s.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={motivoTexto}
              onChangeText={setMotivoTexto}
              placeholder="Ej. Foto borrosa, datos no coinciden…"
              placeholderTextColor="#aaa"
              multiline
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnRechazar} onPress={handleRechazar} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnTxt}>Rechazar</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setModalRechazo(false)}>
                <Text style={s.modalBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
                     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back:            { color: '#C8E6C9', fontWeight: '700', fontSize: 15 },
  headerTitle:     { color: '#fff', fontWeight: '800', fontSize: 17 },
  scroll:          { paddingBottom: 32 },
  secLabel:        { fontSize: 11, fontWeight: '700', color: '#558B2F', textTransform: 'uppercase',
                     letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  card:            { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#e0e0e0',
                     padding: 16, marginHorizontal: 16, marginBottom: 4 },
  alumnoRow:       { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  photo:           { width: 72, height: 72, borderRadius: 36 },
  photoFallback:   { backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  photoLetter:     { color: '#fff', fontSize: 28, fontWeight: '800' },
  name:            { color: DARK, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  meta:            { color: '#666', marginTop: 3, fontSize: 13, lineHeight: 19 },
  sectionTitle:    { color: DARK, fontWeight: '700', fontSize: 15 },
  // Fotos
  fotosRow:        { flexDirection: 'row', gap: 10, marginBottom: 10 },
  fotoCard:        { flex: 1 },
  fotoLabel:       { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 6 },
  fotoImg:         { width: '100%', height: 100, borderRadius: 10, backgroundColor: '#f0f0f0' },
  fotoPlaceholder: { width: '100%', height: 100, borderRadius: 10, backgroundColor: '#f5f5f5',
                     justifyContent: 'center', alignItems: 'center',
                     borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  fotoPlaceholderTxt: { color: '#bbb', fontSize: 12 },
  // Estado verificación
  estadoBadge:     { flexDirection: 'row', alignItems: 'center', gap: 10,
                     borderRadius: 12, padding: 12, marginBottom: 14 },
  estadoIcono:     { fontSize: 24 },
  estadoLabel:     { fontSize: 15, fontWeight: '700' },
  estadoSub:       { fontSize: 12, color: '#888', marginTop: 2 },
  actionRow:       { flexDirection: 'row', gap: 10 },
  btnAprobar:      { flex: 1, backgroundColor: GREEN, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnRechazar:     { flex: 1, backgroundColor: '#C62828', borderRadius: 12, padding: 13, alignItems: 'center' },
  btnTxt:          { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnSecundario:   { backgroundColor: '#fff', borderWidth: 1.5, borderColor: GREEN, borderRadius: 12,
                     padding: 14, marginHorizontal: 16, alignItems: 'center' },
  btnSecundarioTxt:{ color: GREEN, fontWeight: '700', fontSize: 14 },
  rowBetween:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron:         { color: GREEN, fontWeight: '700', fontSize: 13 },
  gradeCard:       { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12, marginTop: 8 },
  gradeTitle:      { color: DARK, fontWeight: '700', marginBottom: 4 },
  // Modales
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  modalBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 20,
                     borderWidth: 0.5, borderColor: '#e0e0e0' },
  modalTitle:      { color: DARK, fontWeight: '800', fontSize: 18, marginBottom: 6 },
  modalSub:        { color: '#888', fontSize: 13, marginBottom: 12 },
  modalInput:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
                     color: '#333', fontSize: 14, marginBottom: 16, backgroundColor: '#fafafa' },
  modalBtns:       { flexDirection: 'row', gap: 10 },
  modalBtnPrimary: { flex: 1, backgroundColor: GREEN, borderRadius: 10, padding: 13, alignItems: 'center' },
  modalBtnRechazar:{ flex: 1, backgroundColor: '#C62828', borderRadius: 10, padding: 13, alignItems: 'center' },
  modalBtnCancel:  { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 13,
                     alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  modalBtnCancelTxt:{ color: '#555', fontWeight: '600' },
  // Partes de rechazo
  parteBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                     borderRadius: 10, marginBottom: 8, backgroundColor: '#fafafa',
                     borderWidth: 0.5, borderColor: '#e0e0e0' },
  parteBtnSel:     { borderColor: GREEN, backgroundColor: '#F1F8E9' },
  parteBtnTxt:     { fontSize: 14, color: '#555', flex: 1 },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc' },
  radioSel:        { borderColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  radioInner:      { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
});


