import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { BASE_URL } from '../services/api';

// NO importar useAuth aquí — durante registro no hay sesión activa todavía.

const GREEN = '#2E7D32';

async function subirFotoCredencial(uri, endpoint, token) {
  const campo = endpoint.includes('frente') ? 'frente' : 'reverso';
  const form  = new FormData();
  form.append(campo, { uri, type: 'image/jpeg', name: `${campo}.jpg` });
  const res  = await fetch(`${BASE_URL.replace(/\/$/,'')}${endpoint}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function SubirCredencialScreen({ route, navigation }) {
  // tokenTemporal viene del backend al registrar (POST /api/auth/registro)
  // id_usuario también viene de ese response
  // NO se llama login() ni guardarSesion() en ningún punto de este screen.
  const { tokenTemporal, id_usuario } = route.params || {};

  const [permiso, pedir]        = useCameraPermissions();
  const [paso,    setPaso]      = useState(1); // 1=frente, 2=reverso
  const [frenteUri, setFrenteUri] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const camRef = useRef(null);

  if (!permiso?.granted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centrado}>
          <Text style={s.centradoEmoji}>📷</Text>
          <Text style={s.centradoTitulo}>Permiso de cámara</Text>
          <Text style={s.centradoSub}>Necesitamos acceso a la cámara para fotografiar tu credencial UMB.</Text>
          <TouchableOpacity style={s.btn} onPress={pedir}>
            <Text style={s.btnTxt}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tomar = async () => {
    if (!camRef.current || subiendo) return;

    if (!tokenTemporal) {
      Alert.alert('Error de sesión', 'No se encontró el token de registro. Vuelve a intentarlo desde el inicio.');
      return;
    }

    setSubiendo(true);
    try {
      const foto = await camRef.current.takePictureAsync({ quality: 0.75 });

      if (paso === 1) {
        // Subir FRENTE — usando tokenTemporal, sin activar sesión
        await subirFotoCredencial(foto.uri, '/api/auth/subir-credencial-frente', tokenTemporal);
        setFrenteUri(foto.uri);
        setPaso(2); // → mostrar paso reverso, NO navegar a CuentaPendiente
      } else {
        // Subir REVERSO — usando tokenTemporal, sin activar sesión
        await subirFotoCredencial(foto.uri, '/api/auth/subir-credencial-reverso', tokenTemporal);
        // Avanzar a selfie pasando el mismo tokenTemporal e id_usuario
        navigation.replace('Selfie', { tokenTemporal, id_usuario });
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo procesar la foto. Intenta de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  const instrucciones = paso === 1
    ? ['📄 Fotografía el FRENTE de tu credencial UMB', '💡 Busca buena iluminación', '📸 Centra la credencial en pantalla']
    : ['🔄 Ahora fotografía el REVERSO de tu credencial', '💡 Misma iluminación', '📸 Centra la credencial en pantalla'];

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>PASO {paso + 1} DE 4</Text>
        <Text style={s.headerTitulo}>{paso === 1 ? 'Credencial — Frente' : 'Credencial — Reverso'}</Text>
      </View>

      {/* Barra progreso */}
      <View style={s.progBar}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[s.progStep, i <= paso + 1 && s.progStepActivo]} />
        ))}
      </View>

      {/* Preview frente cuando ya fue tomado */}
      {paso === 2 && frenteUri && (
        <View style={s.previewRow}>
          <Image source={{ uri: frenteUri }} style={s.previewImg} />
          <View style={s.previewInfo}>
            <Text style={s.previewLabel}>✅ Frente guardado</Text>
            <Text style={s.previewSub}>Ahora fotografía el reverso</Text>
          </View>
        </View>
      )}

      {/* Instrucciones */}
      <View style={s.instruccionesBox}>
        {instrucciones.map((t, i) => <Text key={i} style={s.instruccionTxt}>{t}</Text>)}
      </View>

      {/* Cámara */}
      <View style={s.camWrapper}>
        <CameraView ref={camRef} style={s.cam} facing="back" />
        <View style={s.marco} pointerEvents="none">
          <View style={s.marcoInner} />
        </View>
      </View>

      {/* Botón capturar */}
      <TouchableOpacity
        style={[s.btn, subiendo && { opacity: 0.6 }]}
        onPress={tomar}
        disabled={subiendo}
      >
        {subiendo
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnTxt}>{paso === 1 ? '📷 Fotografiar frente' : '📷 Fotografiar reverso'}</Text>
        }
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f5f5f5' },
  centrado:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centradoEmoji:   { fontSize: 56, marginBottom: 16 },
  centradoTitulo:  { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginBottom: 8 },
  centradoSub:     { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  header:          { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerLabel:     { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700',
                     letterSpacing: 1.5, marginBottom: 4 },
  headerTitulo:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  progBar:         { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: 12 },
  progStep:        { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#ddd' },
  progStepActivo:  { backgroundColor: GREEN },
  previewRow:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                     margin: 12, backgroundColor: '#E8F5E9', borderRadius: 12,
                     padding: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  previewImg:      { width: 60, height: 40, borderRadius: 6 },
  previewLabel:    { fontSize: 13, fontWeight: '700', color: GREEN },
  previewInfo:     { flex: 1 },
  previewSub:      { fontSize: 12, color: '#558B2F', marginTop: 2 },
  instruccionesBox:{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  instruccionTxt:  { fontSize: 13, color: '#555', lineHeight: 22 },
  camWrapper:      { flex: 1, marginHorizontal: 16, marginVertical: 10,
                     borderRadius: 16, overflow: 'hidden', position: 'relative' },
  cam:             { flex: 1 },
  marco:           { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  marcoInner:      { width: '88%', height: '60%', borderWidth: 2, borderRadius: 8,
                     borderColor: 'rgba(255,255,255,0.75)', borderStyle: 'dashed' },
  btn:             { backgroundColor: GREEN, marginHorizontal: 16, marginBottom: 16,
                     borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
  btnTxt:          { color: '#fff', fontWeight: '700', fontSize: 16 },
});
