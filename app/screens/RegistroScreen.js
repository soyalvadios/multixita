import React, { useMemo, useState } from 'react';
import {
  Alert, Modal, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CARRERAS_UES, obtenerGruposPorCarrera, UES_NOMBRE } from '../data/uesTemascalcingo';
import { registrarAlumno } from '../services/api';

const GREEN = '#2E7D32';

function SelectorModal({ visible, title, options, selectedValue, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[s.modalOption, option === selectedValue && s.modalOptionSelected]}
                onPress={() => { onSelect(option); onClose(); }}
              >
                <Text style={[s.modalOptionText, option === selectedValue && { fontWeight: '700', color: GREEN }]}>
                  {option}
                </Text>
                {option === selectedValue && <Text style={{ color: GREEN }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose}>
            <Text style={s.modalCloseTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RegistroScreen({ navigation }) {
  const [nombre,          setNombre]          = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [matricula,       setMatricula]       = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [carrera,         setCarrera]         = useState(CARRERAS_UES[0].nombre);
  const [grupo,           setGrupo]           = useState(CARRERAS_UES[0].grupos[0]);
  const [loading,         setLoading]         = useState(false);
  const [modalCarrera,    setModalCarrera]    = useState(false);
  const [modalGrupo,      setModalGrupo]      = useState(false);

  const carreras = useMemo(() => CARRERAS_UES.map(c => c.nombre), []);
  const grupos   = useMemo(() => obtenerGruposPorCarrera(carrera), [carrera]);

  const cambiarCarrera = nueva => {
    setCarrera(nueva);
    const g = obtenerGruposPorCarrera(nueva);
    setGrupo(g[0] || '');
  };

  const handleContinuar = async () => {
    // Validaciones — apellido_materno es OBLIGATORIO
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio.'); return;
    }
    if (!apellidoPaterno.trim()) {
      Alert.alert('Campo requerido', 'El apellido paterno es obligatorio.'); return;
    }
    if (!apellidoMaterno.trim()) {
      Alert.alert('Campo requerido', 'El apellido materno es obligatorio.'); return;
    }
    if (!matricula.trim()) {
      Alert.alert('Campo requerido', 'La matrícula es obligatoria.'); return;
    }
    if (!password) {
      Alert.alert('Campo requerido', 'La contraseña es obligatoria.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'La confirmación no coincide.'); return;
    }

    setLoading(true);
    try {
      // registrarAlumno devuelve { id_usuario, token } según el backend
      const respuesta = await registrarAlumno({
        nombre:           nombre.trim(),
        apellido_paterno: apellidoPaterno.trim(),
        apellido_materno: apellidoMaterno.trim(),
        matricula:        matricula.trim(),
        ues:              UES_NOMBRE,
        carrera,
        grupo,
        password,
      });

      // NO llamar login() aquí. Pasar id_usuario, token temporal y credenciales
      // a SubirCredencialScreen para continuar el flujo sin activar sesión real.
      navigation.navigate('SubirCredencial', {
        id_usuario: respuesta.id_usuario,
        tokenTemporal: respuesta.token,
        matricula: matricula.trim(),
        password,
      });
    } catch (e) {
      Alert.alert('No se pudo registrar', e.message || 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <SelectorModal
        visible={modalCarrera} title="Selecciona carrera"
        options={carreras} selectedValue={carrera}
        onSelect={cambiarCarrera} onClose={() => setModalCarrera(false)}
      />
      <SelectorModal
        visible={modalGrupo} title="Selecciona grupo"
        options={grupos} selectedValue={grupo}
        onSelect={setGrupo} onClose={() => setModalGrupo(false)}
      />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Crear cuenta</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Barra de pasos */}
      <View style={s.pasosBar}>
        {['Datos', 'Credencial', 'Selfie', 'Listo'].map((p, i) => (
          <View key={p} style={s.pasoItem}>
            <View style={[s.pasoCirlo, i === 0 && s.pasoCirloActivo]}>
              <Text style={[s.pasoNum, i === 0 && s.pasoNumActivo]}>{i + 1}</Text>
            </View>
            <Text style={[s.pasoLabel, i === 0 && s.pasoLabelActivo]}>{p}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.readonlyBox}>
            <Text style={s.readonlyLabel}>Unidad educativa</Text>
            <Text style={s.readonlyVal}>{UES_NOMBRE}</Text>
          </View>

          <View style={s.fila}>
            <View style={s.mitad}>
              <Text style={s.label}>Nombre *</Text>
              <TextInput style={s.input} value={nombre} onChangeText={setNombre}
                placeholder="Nombre(s)" placeholderTextColor="#aaa" />
            </View>
            <View style={s.mitad}>
              <Text style={s.label}>Apellido paterno *</Text>
              <TextInput style={s.input} value={apellidoPaterno} onChangeText={setApellidoPaterno}
                placeholder="Apellido paterno" placeholderTextColor="#aaa" />
            </View>
          </View>

          {/* CORREGIDO: apellido_materno OBLIGATORIO */}
          <Text style={s.label}>Apellido materno *</Text>
          <TextInput
            style={s.input}
            value={apellidoMaterno}
            onChangeText={setApellidoMaterno}
            placeholder="Apellido materno"
            placeholderTextColor="#aaa"
          />

          <View style={s.fila}>
            <View style={s.mitad}>
              <Text style={s.label}>Matrícula *</Text>
              <TextInput style={s.input} value={matricula} onChangeText={setMatricula}
                placeholder="Ej. 26230001" placeholderTextColor="#aaa"
                autoCapitalize="characters" keyboardType="numeric" />
            </View>
            <View style={s.mitad}>
              <Text style={s.label}>Contraseña *</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres" placeholderTextColor="#aaa" secureTextEntry />
            </View>
          </View>

          <Text style={s.label}>Confirmar contraseña *</Text>
          <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword}
            placeholder="Repite la contraseña" placeholderTextColor="#aaa" secureTextEntry />

          <View style={s.fila}>
            <View style={s.mitad}>
              <Text style={s.label}>Carrera *</Text>
              <TouchableOpacity style={s.selector} onPress={() => setModalCarrera(true)}>
                <Text style={s.selectorTxt} numberOfLines={1}>{carrera}</Text>
                <Text style={s.selectorIcon}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={s.mitad}>
              <Text style={s.label}>Grupo *</Text>
              <TouchableOpacity style={s.selector} onPress={() => setModalGrupo(true)}>
                <Text style={s.selectorTxt}>{grupo}</Text>
                <Text style={s.selectorIcon}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTxt}>
              Al continuar deberás fotografiar tu credencial UMB (frente y reverso) y luego tomarte una selfie para verificar tu identidad.
            </Text>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.65 }]}
            onPress={handleContinuar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnTxt}>{loading ? 'Registrando...' : 'Continuar →'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:                { flex: 1, backgroundColor: '#f5f5f5' },
  header:              { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 14,
                         paddingHorizontal: 16, flexDirection: 'row',
                         justifyContent: 'space-between', alignItems: 'center' },
  backBtn:             { width: 64 },
  backTxt:             { color: '#C8E6C9', fontSize: 15, fontWeight: '600' },
  headerTitulo:        { color: '#fff', fontSize: 17, fontWeight: '700' },
  pasosBar:            { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around',
                         paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  pasoItem:            { alignItems: 'center', gap: 4 },
  pasoCirlo:           { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0',
                         alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  pasoCirloActivo:     { backgroundColor: GREEN, borderColor: GREEN },
  pasoNum:             { fontSize: 12, fontWeight: '700', color: '#aaa' },
  pasoNumActivo:       { color: '#fff' },
  pasoLabel:           { fontSize: 10, color: '#aaa', fontWeight: '500' },
  pasoLabelActivo:     { color: GREEN, fontWeight: '700' },
  scroll:              { padding: 16, paddingBottom: 40 },
  card:                { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                         borderWidth: 0.5, borderColor: '#e0e0e0' },
  fila:                { flexDirection: 'row', gap: 12 },
  mitad:               { flex: 1 },
  label:               { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input:               { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
                         fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 2 },
  readonlyBox:         { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12,
                         borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 8 },
  readonlyLabel:       { fontSize: 10, color: '#558B2F', fontWeight: '700', letterSpacing: 0.5,
                         marginBottom: 2, textTransform: 'uppercase' },
  readonlyVal:         { fontSize: 14, fontWeight: '600', color: '#1B5E20' },
  selector:            { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
                         flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                         backgroundColor: '#fafafa', marginBottom: 2 },
  selectorTxt:         { fontSize: 13, color: '#333', flex: 1, marginRight: 6 },
  selectorIcon:        { color: GREEN, fontSize: 14 },
  infoBox:             { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12, marginTop: 16,
                         marginBottom: 16, borderWidth: 1, borderColor: '#C8E6C9' },
  infoTxt:             { fontSize: 13, color: '#558B2F', lineHeight: 19 },
  btn:                 { backgroundColor: GREEN, borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
  btnTxt:              { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  modalCard:           { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                         borderWidth: 0.5, borderColor: '#e0e0e0' },
  modalTitle:          { fontSize: 17, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  modalOption:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                         paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4,
                         backgroundColor: '#fafafa', borderWidth: 0.5, borderColor: '#eee' },
  modalOptionSelected: { borderColor: GREEN, backgroundColor: '#F1F8E9' },
  modalOptionText:     { fontSize: 14, color: '#333', flex: 1 },
  modalCloseBtn:       { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  modalCloseTxt:       { color: GREEN, fontWeight: '700', fontSize: 14 },
});
