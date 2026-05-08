// screens/CoordinadorAgregarDocente.js
// El administrador crea un docente y le asigna materia + grupo + periodo
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { crearDocente, getMateriasGrupos } from '../services/api';
import { colors, radius, spacing } from './SharedStyles';

const GREEN = '#2E7D32';

function SelectorModal({ visible, title, options, labelKey, valueKey, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt, i) => {
              const val = opt[valueKey];
              const lbl = opt[labelKey];
              const sel = selected === val;
              return (
                <TouchableOpacity key={i}
                  style={[s.modalOpt, sel && s.modalOptSel]}
                  onPress={() => { onSelect(opt); onClose(); }}
                >
                  <Text style={[s.modalOptTxt, sel && { fontWeight: '700' }]}>{lbl}</Text>
                  {sel && <Text style={{ color: GREEN }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={s.modalClose} onPress={onClose}>
            <Text style={s.modalCloseTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CoordinadorAgregarDocente() {
  const { token, handleTokenExpired } = useAuth();

  // Datos del docente
  const [nombre,          setNombre]         = useState('');
  const [apellidoP,       setApellidoP]      = useState('');
  const [apellidoM,       setApellidoM]      = useState('');
  const [badge,           setBadge]          = useState('');
  const [password,        setPassword]       = useState('');

  // Catálogos
  const [materias, setMaterias]  = useState([]);
  const [grupos,   setGrupos]    = useState([]);
  const [periodos, setPeriodos]  = useState([]);
  const [cargando, setCargando]  = useState(true);

  // Asignación seleccionada
  const [materiaObj,  setMateriaObj]  = useState(null);
  const [grupoObj,    setGrupoObj]    = useState(null);
  const [periodoObj,  setPeriodoObj]  = useState(null);

  // Modales
  const [modalMat, setModalMat] = useState(false);
  const [modalGru, setModalGru] = useState(false);
  const [modalPer, setModalPer] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMateriasGrupos(token, handleTokenExpired)
      .then(d => {
        setMaterias(Array.isArray(d?.materias) ? d.materias : []);
        setGrupos(Array.isArray(d?.grupos)     ? d.grupos   : []);
        setPeriodos(Array.isArray(d?.periodos) ? d.periodos : []);
      })
      .catch(e => Alert.alert('Error al cargar catálogos', e.message))
      .finally(() => setCargando(false));
  }, []);

  const submit = async () => {
    if (!nombre.trim() || !apellidoP.trim() || !badge.trim() || !password.trim()) {
      return Alert.alert('Faltan datos', 'Completa nombre, apellido paterno, badge y contraseña.');
    }
    if (password.length < 6) {
      return Alert.alert('Contraseña inválida', 'Mínimo 6 caracteres.');
    }

    const payload = {
      nombre:           nombre.trim(),
      apellido_paterno: apellidoP.trim(),
      apellido_materno: apellidoM.trim() || undefined,
      badge:            badge.trim(),
      password,
      id_materia:  materiaObj?.id  || undefined,
      id_grupo:    grupoObj?.id    || undefined,
      id_periodo:  periodoObj?.id  || undefined,
    };

    setLoading(true);
    try {
      const result = await crearDocente(token, payload, handleTokenExpired);
      const asigMsg = result.asignacion
        ? `\nAsignación: ${result.asignacion.materia} · ${result.asignacion.grupo}`
        : '\nSin asignación (agrégala después desde la BD).';

      Alert.alert(
        '✅ Docente creado',
        `Badge: ${result.badge}\n` +
        `Nombre: ${nombre} ${apellidoP}\n` +
        `Contraseña: ${password}${asigMsg}`,
        [{ text: 'OK' }]
      );
      // Limpiar
      setNombre(''); setApellidoP(''); setApellidoM('');
      setBadge(''); setPassword('');
      setMateriaObj(null); setGrupoObj(null); setPeriodoObj(null);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <SelectorModal
        visible={modalMat}
        title="Seleccionar materia"
        options={materias}
        labelKey="nombre"
        valueKey="id"
        selected={materiaObj?.id}
        onSelect={setMateriaObj}
        onClose={() => setModalMat(false)}
      />
      <SelectorModal
        visible={modalGru}
        title="Seleccionar grupo"
        options={grupos.map(g => ({ ...g, label: `${g.nombre} — ${g.carrera} (${g.periodo})` }))}
        labelKey="label"
        valueKey="id"
        selected={grupoObj?.id}
        onSelect={setGrupoObj}
        onClose={() => setModalGru(false)}
      />
      <SelectorModal
        visible={modalPer}
        title="Seleccionar periodo"
        options={periodos}
        labelKey="nombre"
        valueKey="id"
        selected={periodoObj?.id}
        onSelect={setPeriodoObj}
        onClose={() => setModalPer(false)}
      />

      <View style={s.header}>
        <Text style={s.headerTitulo}>Agregar docente</Text>
        <Text style={s.headerSub}>UES Temascalcingo · MultiXita</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Datos del docente ─────────────────────── */}
        <Text style={s.seccion}>Datos del docente</Text>
        <View style={s.card}>
          <Text style={s.label}>Nombre *</Text>
          <TextInput style={s.input} value={nombre} onChangeText={setNombre}
            placeholder="Nombre(s)" placeholderTextColor={colors.faint} />

          <Text style={s.label}>Apellido paterno *</Text>
          <TextInput style={s.input} value={apellidoP} onChangeText={setApellidoP}
            placeholder="Apellido paterno" placeholderTextColor={colors.faint} />

          <Text style={s.label}>Apellido materno</Text>
          <TextInput style={s.input} value={apellidoM} onChangeText={setApellidoM}
            placeholder="Apellido materno (opcional)" placeholderTextColor={colors.faint} />

          <Text style={s.label}>Badge / número empleado *</Text>
          <TextInput style={s.input} value={badge} onChangeText={setBadge}
            placeholder="Ej. 03271" placeholderTextColor={colors.faint}
            autoCapitalize="none" />

          <Text style={s.label}>Contraseña inicial *</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.faint}
            secureTextEntry />
        </View>

        {/* ── Asignación académica ──────────────────── */}
        <Text style={s.seccion}>Asignación académica <Text style={s.opcional}>(opcional)</Text></Text>
        <Text style={s.seccionSub}>
          Si asignas materia + grupo + periodo ahora, el docente podrá crear
          tutorías desde el primer login. Puedes dejarlo en blanco y asignarlo después.
        </Text>

        {cargando ? (
          <ActivityIndicator color={GREEN} style={{ margin: 16 }} />
        ) : (
          <View style={s.card}>
            {/* Materia */}
            <Text style={s.label}>Materia</Text>
            <TouchableOpacity style={s.selector} onPress={() => setModalMat(true)}>
              <Text style={materiaObj ? s.selectorTxt : s.selectorPlaceholder} numberOfLines={1}>
                {materiaObj ? `${materiaObj.clave} — ${materiaObj.nombre}` : 'Seleccionar materia...'}
              </Text>
              <Text style={s.selectorIcon}>▾</Text>
            </TouchableOpacity>

            {/* Grupo */}
            <Text style={s.label}>Grupo</Text>
            <TouchableOpacity style={s.selector} onPress={() => setModalGru(true)}>
              <Text style={grupoObj ? s.selectorTxt : s.selectorPlaceholder} numberOfLines={1}>
                {grupoObj ? `${grupoObj.nombre} — ${grupoObj.carrera}` : 'Seleccionar grupo...'}
              </Text>
              <Text style={s.selectorIcon}>▾</Text>
            </TouchableOpacity>

            {/* Periodo */}
            <Text style={s.label}>Periodo</Text>
            <TouchableOpacity style={s.selector} onPress={() => setModalPer(true)}>
              <Text style={periodoObj ? s.selectorTxt : s.selectorPlaceholder}>
                {periodoObj ? periodoObj.nombre : 'Seleccionar periodo...'}
              </Text>
              <Text style={s.selectorIcon}>▾</Text>
            </TouchableOpacity>

            {/* Resumen de asignación */}
            {materiaObj && grupoObj && periodoObj && (
              <View style={s.resumenBox}>
                <Text style={s.resumenTitulo}>Asignación que se creará</Text>
                <Text style={s.resumenLinea}>📚 {materiaObj.nombre} ({materiaObj.clave})</Text>
                <Text style={s.resumenLinea}>👥 Grupo {grupoObj.nombre}</Text>
                <Text style={s.resumenLinea}>📅 {periodoObj.nombre}</Text>
                <Text style={s.resumenLinea}>
                  👤 {nombre || 'Docente'} {apellidoP} · Badge: {badge || '—'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Botón guardar */}
        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>Guardar docente</Text>
          }
        </TouchableOpacity>

        {/* Info demo */}
        <View style={s.infoBox}>
          <Text style={s.infoTitulo}>📋 Ejemplo real del proyecto</Text>
          <Text style={s.infoTxt}>Docente: Gerardo Blas Ruiz · Badge: 03271</Text>
          <Text style={s.infoTxt}>Materia: Redes de Computadoras I (LFQ1017)</Text>
          <Text style={s.infoTxt}>Grupo: 26LF351 · Periodo: 25-26/1</Text>
          <Text style={s.infoTxt}>Alumnos: 8 (del acta parcial)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20 },
  headerTitulo: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  scroll:       { padding: 16, paddingBottom: 40 },
  seccion:      { fontSize: 12, fontWeight: '700', color: '#1B5E20', textTransform: 'uppercase',
                  letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  seccionSub:   { fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 18 },
  opcional:     { fontWeight: '400', color: '#aaa', textTransform: 'none' },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
                  borderWidth: 0.5, borderColor: '#e0e0e0' },
  label:        { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 10 },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
                  fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 2 },
  selector:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#fafafa', marginBottom: 2 },
  selectorTxt:         { fontSize: 14, color: '#333', flex: 1, marginRight: 8 },
  selectorPlaceholder: { fontSize: 14, color: '#aaa', flex: 1, marginRight: 8 },
  selectorIcon:        { color: GREEN, fontSize: 14 },
  resumenBox:   { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12, marginTop: 10,
                  borderWidth: 1, borderColor: '#C8E6C9' },
  resumenTitulo:{ fontSize: 11, fontWeight: '700', color: '#1B5E20', textTransform: 'uppercase',
                  letterSpacing: 0.5, marginBottom: 8 },
  resumenLinea: { fontSize: 13, color: '#555', lineHeight: 22 },
  btn:          { backgroundColor: GREEN, borderRadius: 28, paddingVertical: 15,
                  alignItems: 'center', marginTop: 4, marginBottom: 12 },
  btnTxt:       { color: '#fff', fontWeight: '700', fontSize: 15 },
  infoBox:      { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  borderWidth: 0.5, borderColor: '#C8E6C9', marginTop: 4 },
  infoTitulo:   { fontSize: 12, fontWeight: '700', color: GREEN, marginBottom: 8 },
  infoTxt:      { fontSize: 12, color: '#666', lineHeight: 20 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  modalOpt:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4,
                  backgroundColor: '#fafafa', borderWidth: 0.5, borderColor: '#eee' },
  modalOptSel:  { borderColor: GREEN, backgroundColor: '#F1F8E9' },
  modalOptTxt:  { fontSize: 13, color: '#333', flex: 1, marginRight: 8 },
  modalClose:   { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  modalCloseTxt:{ color: GREEN, fontWeight: '700', fontSize: 14 },
});
