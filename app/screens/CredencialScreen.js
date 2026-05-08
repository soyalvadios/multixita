import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, SafeAreaView,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';

const { width: SW } = Dimensions.get('window');
const QR_INTERVALO  = 10; // segundos

function generarQRData(usuario) {
  const ventana = Math.floor(Date.now() / (QR_INTERVALO * 1000));
  return JSON.stringify({
    matricula: usuario?.matricula,
    nombre:    `${usuario?.nombre || ''} ${usuario?.apellido_paterno || ''}`.trim(),
    rol:       usuario?.rol || 'alumno',
    carrera:   usuario?.carrera || 'UES Temascalcingo',
    grupo:     usuario?.grupo   || '',
    t:         ventana,
  });
}

function ContadorQR({ segundos }) {
  const color = segundos > 6 ? '#2E7D32' : segundos > 3 ? '#F57F17' : '#C62828';
  return (
    <View style={s.contadorRow}>
      <Text style={s.contadorLabel}>Código válido por</Text>
      <View style={[s.contadorBadge, { borderColor: color }]}>
        <Text style={[s.contadorNum, { color }]}>{segundos}s</Text>
      </View>
    </View>
  );
}

export default function CredencialScreen() {
  const { usuario } = useAuth();
  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const [qrData,    setQrData]    = useState('');
  const [segundos,  setSegundos]  = useState(QR_INTERVALO);

  useEffect(() => {
    if (!usuario) return;
    setQrData(generarQRData(usuario));
    setSegundos(QR_INTERVALO);

    const tick = setInterval(() => {
      setSegundos(prev => {
        if (prev <= 1) {
          Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
          setQrData(generarQRData(usuario));
          return QR_INTERVALO;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [usuario]);

  const nombreCompleto = [
    usuario?.nombre,
    usuario?.apellido_paterno,
    usuario?.apellido_materno,
  ].filter(Boolean).join(' ');

  const inicial = (usuario?.nombre || '?').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Encabezado institucional */}
        <View style={s.institucional}>
          <Text style={s.instiNombre}>UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO</Text>
          <Text style={s.instiUes}>UES Temascalcingo · Estado de México</Text>
        </View>

        {/* Tarjeta credencial */}
        <View style={s.credencial}>

          {/* Banda superior */}
          <View style={s.banda}>
            <Text style={s.bandaTitulo}>CREDENCIAL DE ACCESO</Text>
            <Text style={s.bandaSub}>MultiXita · Sistema de Control de Acceso</Text>
          </View>

          {/* Datos del alumno */}
          <View style={s.datos}>
            <View style={s.avatarCirculo}>
              <Text style={s.avatarLetra}>{inicial}</Text>
            </View>
            <Text style={s.nombreCompleto}>{nombreCompleto}</Text>
            {!!usuario?.matricula && (
              <View style={s.matriculaBox}>
                <Text style={s.matriculaLabel}>MATRÍCULA</Text>
                <Text style={s.matriculaValor}>{usuario.matricula}</Text>
              </View>
            )}
            <View style={s.metaRow}>
              {!!usuario?.carrera && (
                <View style={s.metaChip}>
                  <Text style={s.metaChipTxt}>{usuario.carrera}</Text>
                </View>
              )}
              {!!usuario?.grupo && (
                <View style={s.metaChip}>
                  <Text style={s.metaChipTxt}>Grupo {usuario.grupo}</Text>
                </View>
              )}
              {!!usuario?.rol && (
                <View style={[s.metaChip, { backgroundColor: '#1B5E20' }]}>
                  <Text style={[s.metaChipTxt, { color: '#fff' }]}>
                    {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Código QR dinámico */}
          <View style={s.qrSection}>
            <ContadorQR segundos={segundos} />
            <Animated.View style={[s.qrWrapper, { opacity: fadeAnim }]}>
              {!!qrData && (
                <QRCode
                  value={qrData}
                  size={SW * 0.52}
                  color="#1B5E20"
                  backgroundColor="#fff"
                />
              )}
            </Animated.View>
            <Text style={s.qrInstruccion}>Presenta este código en la caseta de acceso</Text>
          </View>

          {/* Pie de tarjeta */}
          <View style={s.pie}>
            <Text style={s.pieTxt}>UES Temascalcingo · Estado de México</Text>
            <Text style={[s.pieTxt, { marginTop: 2 }]}>Documento de uso institucional</Text>
          </View>
        </View>

        <Text style={s.notaSeguridad}>
          🔒 El código QR se renueva automáticamente cada {QR_INTERVALO} segundos por seguridad.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f5f5f5' },
  scroll:          { padding: 16, paddingBottom: 40 },
  // Encabezado institucional
  institucional:   { alignItems: 'center', marginBottom: 14 },
  instiNombre:     { fontSize: 10, fontWeight: '700', color: '#1B5E20', textAlign: 'center',
                     letterSpacing: 1, textTransform: 'uppercase' },
  instiUes:        { fontSize: 11, color: '#558B2F', marginTop: 2 },
  // Tarjeta
  credencial:      { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
                     borderWidth: 0.5, borderColor: '#C8E6C9',
                     shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                     shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  banda:           { backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 16,
                     alignItems: 'center' },
  bandaTitulo:     { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  bandaSub:        { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 3, letterSpacing: 0.5 },
  // Datos
  datos:           { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16,
                     borderBottomWidth: 0.5, borderBottomColor: '#E8F5E9' },
  avatarCirculo:   { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2E7D32',
                     alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                     borderWidth: 3, borderColor: '#A5D6A7' },
  avatarLetra:     { color: '#fff', fontSize: 28, fontWeight: '800' },
  nombreCompleto:  { fontSize: 17, fontWeight: '700', color: '#1B5E20', textAlign: 'center' },
  matriculaBox:    { marginTop: 10, alignItems: 'center', backgroundColor: '#F1F8E9',
                     borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8,
                     borderWidth: 1, borderColor: '#C8E6C9' },
  matriculaLabel:  { fontSize: 9, fontWeight: '700', color: '#558B2F', letterSpacing: 2 },
  matriculaValor:  { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginTop: 2, letterSpacing: 1 },
  metaRow:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
                     gap: 6, marginTop: 10 },
  metaChip:        { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 10,
                     paddingVertical: 4, borderWidth: 0.5, borderColor: '#C8E6C9' },
  metaChipTxt:     { fontSize: 11, color: '#1B5E20', fontWeight: '600' },
  // QR
  qrSection:       { alignItems: 'center', paddingVertical: 20,
                     borderBottomWidth: 0.5, borderBottomColor: '#E8F5E9' },
  contadorRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  contadorLabel:   { fontSize: 12, color: '#888' },
  contadorBadge:   { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  contadorNum:     { fontSize: 14, fontWeight: '800' },
  qrWrapper:       { padding: 16, backgroundColor: '#fff', borderRadius: 14,
                     borderWidth: 1, borderColor: '#E8F5E9',
                     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  qrInstruccion:   { fontSize: 12, color: '#558B2F', textAlign: 'center', marginTop: 12 },
  // Pie
  pie:             { backgroundColor: '#F1F8E9', paddingVertical: 12, alignItems: 'center' },
  pieTxt:          { fontSize: 10, color: '#558B2F', letterSpacing: 0.5 },
  // Nota seguridad
  notaSeguridad:   { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
