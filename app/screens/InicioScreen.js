import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions,
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { fetchAuth } from '../services/api';

const { width: SW } = Dimensions.get('window');
const QR_INTERVALO  = 10; // segundos
const OWM_KEY       = 'bb02ab9d9edb81d84393e91c2f07f9e3';
const OWM_CITY      = 'Temascalcingo,MX';

function generarQRData(usuario) {
  const ventana = Math.floor(Date.now() / (QR_INTERVALO * 1000));
  return JSON.stringify({
    matricula: usuario?.matricula,
    nombre:    `${usuario?.nombre || ''} ${usuario?.apellido_paterno || ''}`.trim(),
    carrera:   usuario?.carrera || 'UES Temascalcingo',
    grupo:     usuario?.grupo   || '',
    ues:       'UES Temascalcingo',
    estado:    'ACTIVO',
    t:         ventana,
  });
}

function iconoClima(codigo) {
  if (!codigo) return '🌤';
  const c = codigo.toLowerCase();
  if (c.includes('clear'))        return '☀️';
  if (c.includes('cloud'))        return '⛅';
  if (c.includes('rain'))         return '🌧';
  if (c.includes('drizzle'))      return '🌦';
  if (c.includes('thunderstorm')) return '⛈';
  if (c.includes('snow'))         return '❄️';
  if (c.includes('mist') || c.includes('fog')) return '🌫';
  return '🌤';
}

// ── Modal QR dinámico ─────────────────────────────────────
function ModalQRAcceso({ visible, onCerrar, usuario }) {
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const [qrData,   setQrData]   = useState('');
  const [segundos, setSegundos] = useState(QR_INTERVALO);

  useEffect(() => {
    if (!visible || !usuario) return;
    setQrData(generarQRData(usuario));
    setSegundos(QR_INTERVALO);
    const tick = setInterval(() => {
      setSegundos(prev => {
        if (prev <= 1) {
          Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();
          setQrData(generarQRData(usuario));
          return QR_INTERVALO;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [visible, usuario]);

  const colorContador = segundos > 6 ? '#2E7D32' : segundos > 3 ? '#F57F17' : '#C62828';

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onCerrar}>
      <View style={qs.container}>
        <View style={qs.header}>
          <TouchableOpacity onPress={onCerrar} style={qs.cerrarBtn}>
            <Text style={qs.cerrarTxt}>✕ Cerrar</Text>
          </TouchableOpacity>
          <Text style={qs.titulo}>Código de acceso</Text>
          <View style={{ width: 70 }} />
        </View>

        <Text style={qs.instruccion}>Muestra este código al oficial de la caseta</Text>

        <View style={qs.qrBox}>
          <View style={qs.contadorRow}>
            <Text style={qs.contadorLabel}>Se renueva en</Text>
            <View style={[qs.contadorBadge, { borderColor: colorContador }]}>
              <Text style={[qs.contadorNum, { color: colorContador }]}>{segundos}s</Text>
            </View>
          </View>

          <Animated.View style={[qs.qrGrande, { opacity: fadeAnim }]}>
            {!!qrData && (
              <QRCode
                value={qrData}
                size={SW * 0.65}
                color="#1B5E20"
                backgroundColor="#fff"
              />
            )}
          </Animated.View>

          <Text style={qs.nombre}>{usuario?.nombre} {usuario?.apellido_paterno}</Text>
          <Text style={qs.matricula}>{usuario?.matricula}</Text>
        </View>

        <Text style={qs.pie}>MultiXita · UMB Temascalcingo</Text>
      </View>
    </Modal>
  );
}

// ── Pantalla de Inicio ────────────────────────────────────
export default function InicioScreen() {
  const { usuario, token, cerrarSesion, handleTokenExpired } = useAuth();
  if (!usuario) return null;

  const [modalQR,    setModalQR]    = useState(false);
  const [ultimoReg,  setUltimoReg] = useState(null);
  const [clima,      setClima]     = useState(null);
  const [fecha,      setFecha]     = useState('');
  const [cargando,   setCargando]  = useState(false);
  const [mensaje,    setMensaje]   = useState('');

  useEffect(() => {
    cargarUltimoRegistro();
    cargarClima();
    setFecha(new Date().toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    }));
  }, []);

  const cargarUltimoRegistro = async () => {
    try {
      const data = await fetchAuth('/api/oficial/historial', {}, token, handleTokenExpired);
      if (Array.isArray(data) && data.length > 0) {
        // Buscar el registro del alumno actual
        const mio = data.find(r => r.matricula === usuario?.matricula);
        if (mio) setUltimoReg(mio);
      }
    } catch {}
  };

  const cargarClima = async () => {
    if (!OWM_KEY || OWM_KEY === 'TU_API_KEY') return;
    try {
      const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${OWM_CITY}&appid=${OWM_KEY}&units=metric&lang=es`);
      const data = await res.json();
      if (data?.main) {
        setClima({
          temp:      Math.round(data.main.temp),
          desc:      data.weather[0].description,
          icono:     iconoClima(data.weather[0].main),
          humedad:   data.main.humidity,
          sensacion: Math.round(data.main.feels_like),
        });
      }
    } catch {}
  };

  const formatHora = f => f
    ? new Date(f).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const dentroAhora = ultimoReg && !ultimoReg.hora_salida;

  return (
    <>
      <ModalQRAcceso
        visible={modalQR}
        onCerrar={() => setModalQR(false)}
        usuario={usuario}
      />

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header verde ──────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.saludo}>Bienvenido,</Text>
              <Text style={s.nombre}>{usuario.nombre}</Text>
              <Text style={s.detalle}>{usuario.carrera || 'UES Temascalcingo'}</Text>
              <Text style={s.detalle}>Grupo: {usuario.grupo || '—'}</Text>
            </View>
            {clima && (
              <View style={s.climaBox}>
                <Text style={s.climaIcono}>{clima.icono}</Text>
                <Text style={s.climaTemp}>{clima.temp}°</Text>
              </View>
            )}
          </View>
          <Text style={s.fechaTxt}>📅 {fecha}</Text>
          {clima && (
            <View style={s.climaDetalle}>
              <Text style={s.climaDetalleTxt}>
                {clima.icono} {clima.desc} · {clima.temp}°C · Sensación {clima.sensacion}°C · Humedad {clima.humedad}%
              </Text>
              <Text style={s.climaLugar}>📍 Temascalcingo, Edomex</Text>
            </View>
          )}
        </View>

        {/* ── Último registro ────────────────────────────── */}
        {ultimoReg && (
          <View style={[s.regCard, dentroAhora ? s.regCardDentro : s.regCardFuera]}>
            <Text style={s.regIcono}>{dentroAhora ? '🟢' : '⚪'}</Text>
            <View>
              <Text style={s.regTitulo}>{dentroAhora ? 'Estás dentro del campus' : 'Último acceso'}</Text>
              <Text style={s.regDetalle}>
                Entrada: {formatHora(ultimoReg.hora_entrada)}
                {ultimoReg.hora_salida ? ` · Salida: ${formatHora(ultimoReg.hora_salida)}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* ── Acceso rápido QR ──────────────────────────── */}
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Acceso al campus</Text>

          {!!mensaje && (
            <View style={s.mensajeBox}>
              <Text style={s.mensajeTxt}>{mensaje}</Text>
            </View>
          )}

          {/* Botón QR rápido */}
          <TouchableOpacity style={s.qrRapidoBtn} onPress={() => setModalQR(true)}>
            <Text style={s.qrRapidoIcono}>⬛</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.qrRapidoTitulo}>Mi código QR de acceso</Text>
              <Text style={s.qrRapidoSub}>Toca para mostrar al oficial de la caseta</Text>
            </View>
            <Text style={s.qrRapidoChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Resumen académico (próximamente) ─────────── */}
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Resumen académico</Text>
          <View style={s.proximamenteCard}>
            <Text style={s.proximamenteIcono}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.proximamenteTitulo}>Próximamente</Text>
              <Text style={s.proximamenteSub}>
                Aquí podrás ver tu resumen académico, calificaciones por parcial y avance general.
                Disponible en la próxima actualización.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </>
  );
}

// ── Estilos Modal QR ──────────────────────────────────────
const qs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', alignItems: 'center',
                  justifyContent: 'space-between', paddingVertical: 50 },
  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', width: '100%', paddingHorizontal: 24 },
  cerrarBtn:    { padding: 8 },
  cerrarTxt:    { color: '#888', fontSize: 14 },
  titulo:       { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  instruccion:  { fontSize: 14, color: '#555', textAlign: 'center', paddingHorizontal: 32 },
  qrBox:        { alignItems: 'center', gap: 12 },
  contadorRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contadorLabel:{ fontSize: 12, color: '#888' },
  contadorBadge:{ borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  contadorNum:  { fontSize: 13, fontWeight: '700' },
  qrGrande:     { backgroundColor: '#fff', padding: 20, borderRadius: 20,
                  borderWidth: 1, borderColor: '#E0E0E0', elevation: 4,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1, shadowRadius: 8 },
  nombre:       { fontSize: 18, fontWeight: '700', color: '#1B5E20', textAlign: 'center' },
  matricula:    { fontSize: 14, color: '#558B2F', textAlign: 'center' },
  pie:          { fontSize: 11, color: '#aaa' },
});

// ── Estilos pantalla ──────────────────────────────────────
const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  // Header
  header:           { backgroundColor: '#2E7D32', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  saludo:           { color: '#A5D6A7', fontSize: 13 },
  nombre:           { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  detalle:          { color: '#C8E6C9', fontSize: 12, marginTop: 2 },
  fechaTxt:         { color: '#A5D6A7', fontSize: 12, marginTop: 10 },
  climaBox:         { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12, padding: 10, minWidth: 60 },
  climaIcono:       { fontSize: 26 },
  climaTemp:        { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  climaDetalle:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, marginTop: 10 },
  climaDetalleTxt:  { color: '#C8E6C9', fontSize: 12, lineHeight: 18 },
  climaLugar:       { color: '#A5D6A7', fontSize: 11, marginTop: 2 },
  // Registro
  regCard:          { marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 14,
                      flexDirection: 'row', alignItems: 'center', gap: 10 },
  regCardDentro:    { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9' },
  regCardFuera:     { backgroundColor: '#f5f5f5', borderWidth: 0.5, borderColor: '#eee' },
  regIcono:         { fontSize: 20 },
  regTitulo:        { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  regDetalle:       { fontSize: 12, color: '#558B2F', marginTop: 2 },
  // Sección
  seccion:          { padding: 20 },
  seccionTitulo:    { fontSize: 15, fontWeight: '700', color: '#2E7D32', marginBottom: 14 },
  mensajeBox:       { borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: '#F1F8E9' },
  mensajeTxt:       { color: '#2E7D32', fontSize: 14 },
  // QR rápido
  qrRapidoBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: '#F1F8E9', borderRadius: 14, padding: 14,
                      borderWidth: 1, borderColor: '#C8E6C9' },
  qrRapidoIcono:    { fontSize: 28 },
  qrRapidoTitulo:   { fontSize: 14, fontWeight: '700', color: '#1B5E20' },
  qrRapidoSub:      { fontSize: 12, color: '#558B2F', marginTop: 2 },
  qrRapidoChevron:  { color: '#2E7D32', fontSize: 20, fontWeight: '700' },
  // Próximamente
  proximamenteCard: { backgroundColor: '#F1F8E9', borderRadius: 14, padding: 14,
                      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                      borderWidth: 1, borderColor: '#C8E6C9' },
  proximamenteIcono:{ fontSize: 32, marginTop: 2 },
  proximamenteTitulo:{ fontSize: 14, fontWeight: '700', color: '#1B5E20', marginBottom: 4 },
  proximamenteSub:  { fontSize: 12, color: '#558B2F', lineHeight: 18 },
});
