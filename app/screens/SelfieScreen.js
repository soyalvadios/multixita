import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { BASE_URL } from '../services/api';

// NO importar useAuth — durante registro no hay sesión activa.
// El token temporal viene de route.params.

const GREEN = '#2E7D32';

async function subirSelfieConToken(uri, token) {
  const form = new FormData();
  form.append('selfie', { uri, type: 'image/jpeg', name: 'selfie.jpg' });
  const res = await fetch(`${BASE_URL.replace(/\/$/,'')}/api/auth/subir-selfie`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function SelfieScreen({ route, navigation }) {
  // tokenTemporal e id_usuario vienen de SubirCredencialScreen via route.params
  const { tokenTemporal, id_usuario } = route.params || {};

  const camRef                    = useRef(null);
  const [permiso, pedir]          = useCameraPermissions();
  const [subiendo, setSubiendo]   = useState(false);
  const [capturada, setCapturada] = useState(false);

  if (!permiso?.granted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centrado}>
          <Text style={s.centradoEmoji}>🤳</Text>
          <Text style={s.centradoTitulo}>Permiso de cámara</Text>
          <Text style={s.centradoSub}>Necesitamos acceso para capturar tu fotografía de registro facial.</Text>
          <TouchableOpacity style={s.btn} onPress={pedir}>
            <Text style={s.btnTxt}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tomarYSubir = async () => {
    if (!camRef.current || subiendo) return;

    if (!tokenTemporal) {
      Alert.alert('Error de sesión', 'No se encontró el token de registro. Vuelve a intentarlo desde el inicio.');
      return;
    }

    setSubiendo(true);
    setCapturada(true);
    try {
      const foto = await camRef.current.takePictureAsync({ quality: 0.75 });
      // Subir selfie con tokenTemporal — NO activa sesión real
      await subirSelfieConToken(foto.uri, tokenTemporal);
      // SOLO aquí, después de selfie exitosa, navegar a CuentaPendiente
      navigation.replace('CuentaPendiente', {
  desdeRegistro: true});
    } catch (e) {
      setCapturada(false);
      Alert.alert('Error al guardar', e.message || 'No se pudo subir la fotografía. Intenta de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>PASO 3 DE 4 — VERIFICACIÓN FACIAL</Text>
        <Text style={s.headerTitulo}>Fotografía de rostro</Text>
        <Text style={s.headerSub}>Esta foto se usará para validar tu identidad al acceder al campus.</Text>
      </View>

      {/* Progreso */}
      <View style={s.progBar}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[s.progStep, i <= 3 && s.progStepActivo]} />
        ))}
      </View>

      {/* Instrucciones */}
      <View style={s.instruccionesRow}>
        {[
          ['💡', 'Buena iluminación'],
          ['😊', 'Rostro descubierto'],
          ['👤', 'Centra tu cara'],
          ['🚫', 'Sin lentes oscuros'],
        ].map(([icon, txt], i) => (
          <View key={i} style={s.chip}>
            <Text style={s.chipIcon}>{icon}</Text>
            <Text style={s.chipTxt}>{txt}</Text>
          </View>
        ))}
      </View>

      {/* Cámara */}
      <View style={s.camContainer}>
        <CameraView ref={camRef} style={s.cam} facing="front" />
        {/* Overlay con oval */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={s.overlayTop} />
          <View style={s.overlayMid}>
            <View style={s.overlaySide} />
            <View style={[s.ovalFrame, capturada && s.ovalFrameOk]} />
            <View style={s.overlaySide} />
          </View>
          <View style={s.overlayBottom} />
        </View>
        <View style={s.estadoCam}>
          <View style={[s.estadoDot, capturada && s.estadoDotOk]} />
          <Text style={[s.estadoTxt, capturada && s.estadoTxtOk]}>
            {capturada ? 'Foto capturada' : 'Listo para capturar'}
          </Text>
        </View>
      </View>

      {/* Controles */}
      <View style={s.controles}>
        <TouchableOpacity
          style={[s.btn, subiendo && s.btnCargando]}
          onPress={tomarYSubir}
          disabled={subiendo}
          activeOpacity={0.85}
        >
          {subiendo
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>📸 Tomar fotografía</Text>
          }
        </TouchableOpacity>
        {/* Nota: "Omitir" eliminado intencionalmente.
            El flujo requiere selfie antes de CuentaPendiente.
            Si hay un caso extremo de omisión, descomentar lo siguiente: */}
        {/* <TouchableOpacity style={s.omitirBtn} onPress={() => navigation.replace('CuentaPendiente')}>
          <Text style={s.omitirTxt}>Omitir por ahora</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8faf8' },
  centrado:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centradoEmoji:  { fontSize: 56, marginBottom: 16 },
  centradoTitulo: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginBottom: 8 },
  centradoSub:    { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  header:         { backgroundColor: '#fff', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
                    borderBottomWidth: 0.5, borderBottomColor: '#E8F5E9' },
  headerLabel:    { fontSize: 10, fontWeight: '700', color: GREEN, letterSpacing: 1.5,
                    textTransform: 'uppercase', marginBottom: 4 },
  headerTitulo:   { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  headerSub:      { fontSize: 12, color: '#888', marginTop: 3 },
  progBar:        { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: 10 },
  progStep:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#ddd' },
  progStepActivo: { backgroundColor: GREEN },
  instruccionesRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F8E9',
                    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: 0.5, borderColor: '#C8E6C9' },
  chipIcon:       { fontSize: 13 },
  chipTxt:        { fontSize: 11, color: '#1B5E20', fontWeight: '500' },
  camContainer:   { flex: 1, marginHorizontal: 20, marginBottom: 10, borderRadius: 20,
                    overflow: 'hidden', backgroundColor: '#1B5E20', position: 'relative' },
  cam:            { flex: 1 },
  overlayTop:     { width: '100%', height: 60, backgroundColor: 'rgba(27,94,32,0.55)' },
  overlayMid:     { flexDirection: 'row', height: 260 },
  overlaySide:    { flex: 1, backgroundColor: 'rgba(27,94,32,0.55)' },
  overlayBottom:  { width: '100%', flex: 1, backgroundColor: 'rgba(27,94,32,0.55)' },
  ovalFrame:      { width: 190, height: 260, borderRadius: 95, borderWidth: 2.5,
                    borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'transparent' },
  ovalFrameOk:    { borderColor: '#69F0AE', borderWidth: 3 },
  estadoCam:      { position: 'absolute', bottom: 12, alignSelf: 'center',
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
                    paddingHorizontal: 14, paddingVertical: 6 },
  estadoDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  estadoDotOk:    { backgroundColor: '#69F0AE' },
  estadoTxt:      { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  estadoTxtOk:    { color: '#69F0AE', fontWeight: '600' },
  controles:      { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
                    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E8F5E9' },
  btn:            { backgroundColor: GREEN, borderRadius: 28, paddingVertical: 15,
                    alignItems: 'center', marginBottom: 10 },
  btnCargando:    { backgroundColor: '#81C784' },
  btnTxt:         { color: '#fff', fontWeight: '700', fontSize: 16 },
  omitirBtn:      { alignItems: 'center', paddingVertical: 8 },
  omitirTxt:      { color: '#aaa', fontSize: 13 },
});
