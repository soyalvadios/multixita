// screens/BotFlotante.js — XitaBot adaptado a MultiXita (sin endpoint externo de IA)
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList,
  KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchAuth } from '../services/api';

// ── Helpers ───────────────────────────────────────────────
const horaActual = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

// Convierte calificaciones del formato del backend al formato del bot
function parsearCalifs(data) {
  if (!Array.isArray(data)) return [];
  const mapa = {};
  for (const c of data) {
    const key = c.materia || c.clave_materia || 'Materia';
    if (!mapa[key]) mapa[key] = { asignatura: key, clave: c.clave_materia, docente: c.docente, parciales: {} };
    mapa[key].parciales[c.parcial] = c.calificacion;
  }
  return Object.values(mapa).map(m => ({
    asignatura: m.asignatura,
    clave:      m.clave,
    docente:    m.docente,
    p1: m.parciales[1] ?? null,
    p2: m.parciales[2] ?? null,
    p3: m.parciales[3] ?? null,
  }));
}

// ── Lógica de bienvenida contextual ──────────────────────
function mensajeBienvenida(nombre, materias) {
  if (!materias || materias.length === 0) {
    return `¡Hola ${nombre}! 👋 Soy XitaBot, tu asistente de MultiXita.\n\nEstoy aquí para ayudarte con tus dudas académicas y apoyarte cuando lo necesites. ¿En qué te puedo ayudar hoy?`;
  }
  const enRiesgo = materias.filter(m => m.p1 !== null && m.p1 < 70);
  const bien     = materias.filter(m => m.p1 !== null && m.p1 >= 70);

  if (enRiesgo.length > 0) {
    const nombres = enRiesgo.slice(0, 2).map(m => m.asignatura.split(' ')[0]).join(' y ');
    return `¡Hola ${nombre}! 👋 Soy XitaBot.\n\nRevisé tus calificaciones y veo que ${enRiesgo.length === 1 ? `la materia de ${nombres} está` : `${nombres} están`} con calificación menor a 70. 📌\n\nPero tranquilo, todavía hay tiempo de mejorar. ¿Quieres que te explique cómo subir tu promedio?`;
  }
  if (bien.length > 0) {
    return `¡Hola ${nombre}! 👋 Soy XitaBot.\n\nVas muy bien en tus materias. Tienes ${bien.length} materia(s) con calificación de 70 o más 💪\n\n¿En qué te puedo apoyar hoy?`;
  }
  return `¡Hola ${nombre}! 👋 Soy XitaBot.\n\nEstoy aquí para ayudarte con tus dudas académicas y apoyarte. ¿En qué te puedo ayudar hoy?`;
}

function sugerenciasContextuales(materias) {
  if (!materias || materias.length === 0) return [
    '¿Cómo funciona la boleta?',
    '¿Qué son las tutorías?',
    'Necesito apoyo emocional',
  ];
  const enRiesgo = materias.filter(m => m.p1 !== null && m.p1 < 70);
  if (enRiesgo.length > 0) return [
    `¿Cómo mejoro en ${enRiesgo[0].asignatura.split(' ')[0]}?`,
    '¿Qué hago si voy reprobando?',
    '¿Cómo funciona una tutoría?',
    'Necesito hablar',
  ];
  return [
    '¿Cómo voy en mis materias?',
    '¿Qué son las tutorías?',
    '¿Cómo registro mi entrada?',
    'Necesito apoyo',
  ];
}

// ── Respuestas locales del bot ────────────────────────────
function generarRespuesta(texto, materias, usuario) {
  const t = texto.toLowerCase();

  // Calificaciones / materias
  if (t.includes('calificacion') || t.includes('calificación') || t.includes('materia') || t.includes('nota') || t.includes('reprobando') || t.includes('boleta') || t.includes('parcial')) {
    if (!materias || materias.length === 0) {
      return 'Aún no tengo tus calificaciones cargadas. Ve a la pestaña **Boleta** para verlas. Si no aparecen, puede ser que tu docente aún no las haya capturado.';
    }
    const enRiesgo = materias.filter(m => m.p1 !== null && m.p1 < 70);
    const lines = materias.map(m => {
      const p = m.p1 !== null ? `P1: ${m.p1}` : 'Sin calificación aún';
      return `📚 ${m.asignatura.substring(0, 30)}: ${p}`;
    }).join('\n');
    const riesgoTxt = enRiesgo.length > 0
      ? `\n\n⚠️ Tienes ${enRiesgo.length} materia(s) con calificación menor a 70. Te recomiendo hablar con tu docente o solicitar una tutoría.`
      : `\n\n✅ Tus calificaciones están al corriente.`;
    return `Aquí están tus calificaciones del parcial 1:\n\n${lines}${riesgoTxt}`;
  }

  // Tutorías
  if (t.includes('tutoria') || t.includes('tutoría') || t.includes('tutor')) {
    return '📋 **Tutorías en MultiXita**\n\nLas tutorías son sesiones de seguimiento académico donde tu docente te apoya. Cuando tu docente publique una tutoría, aparecerá en la pestaña **Tutorías** de tu app.\n\nAhí podrás responder un cuestionario y obtener tu constancia de atención tutorial. ¿Tienes alguna tutoría pendiente?';
  }

  // Acceso / entrada / QR
  if (t.includes('entrada') || t.includes('acceso') || t.includes('caseta') || t.includes('qr') || t.includes('credencial')) {
    return '🏫 **Registro de acceso al campus**\n\nPara registrar tu entrada:\n1. Ve a la pestaña **Credencial** en tu app\n2. Muestra el código QR al oficial de la caseta\n3. El código se renueva cada 10 segundos por seguridad\n\nTambién puedes ver tu último registro en la pantalla de **Inicio**.';
  }

  // Apoyo emocional
  if (t.includes('apoyo') || t.includes('hablar') || t.includes('mal') || t.includes('stress') || t.includes('estrés') || t.includes('estres') || t.includes('ansied') || t.includes('deprimid') || t.includes('preocup')) {
    return `${usuario?.nombre || 'Hola'}, me da gusto que lo compartas. 💙\n\nEstudir puede ser muy exigente y es normal sentirse así a veces. No estás solo/a.\n\nTe recomiendo hablar con tu tutor académico o acudir al área de orientación educativa de la UES. También puedes solicitar una tutoría a través de la app.\n\n¿Hay algo más específico en lo que te pueda ayudar?`;
  }

  // Registro / cuenta
  if (t.includes('registro') || t.includes('cuenta') || t.includes('contraseña') || t.includes('password')) {
    return '🔐 **Cuenta y registro**\n\nSi olvidaste tu contraseña, contacta al coordinador de tu carrera para que la restablezca desde el panel de administración.\n\nSi eres alumno nuevo, registra tu cuenta desde la pantalla de **Login** → "Regístrate aquí" y sigue el proceso de verificación.';
  }

  // Cómo funciona la app
  if (t.includes('funciona') || t.includes('app') || t.includes('multixita') || t.includes('ayuda') || t.includes('qué puedes')) {
    return '📱 **MultiXita — Tu app académica**\n\nPuedo ayudarte con:\n• **Boleta** — ver tus calificaciones por parcial\n• **Tutorías** — responder cuestionarios de seguimiento\n• **Credencial** — tu código QR de acceso al campus\n• **Perfil** — gestionar tus vehículos y contraseña\n\nTambién estoy aquí si necesitas apoyo o tienes dudas. ¿Qué necesitas?';
  }

  // Fallback genérico
  return `Entiendo tu pregunta sobre "${texto.substring(0, 40)}${texto.length > 40 ? '...' : ''}". 🤔\n\nPuedo ayudarte con:\n• Tus calificaciones y materias\n• Cómo funcionan las tutorías\n• Registro de acceso al campus\n• Apoyo y orientación académica\n\n¿Sobre cuál de estos temas necesitas información?`;
}

// ── Burbuja de mensaje ────────────────────────────────────
function Burbuja({ mensaje }) {
  const esBot = mensaje.role === 'model';
  return (
    <View style={[s.burbujaRow, esBot ? s.burbujaRowBot : s.burbujaRowUser]}>
      {esBot && (
        <View style={s.botAvatarSmall}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}
      <View style={[s.burbuja, esBot ? s.burbujaBot : s.burbujaUser]}>
        <Text style={[s.burbujaTexto, esBot ? s.burbujaTextoBot : s.burbujaTextoUser]}>
          {mensaje.text}
        </Text>
        <Text style={[s.burbujaHora, esBot ? { color: '#a5d6a7' } : { color: 'rgba(255,255,255,0.6)' }]}>
          {mensaje.hora}
        </Text>
      </View>
    </View>
  );
}

// ── Modal de chat ─────────────────────────────────────────
function ModalChat({ visible, onCerrar, usuario, token, handleTokenExpired }) {
  const [mensajes,  setMensajes]  = useState([]);
  const [input,     setInput]     = useState('');
  const [pensando,  setPensando]  = useState(false);
  const [materias,  setMaterias]  = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (visible && mensajes.length === 0) {
      cargarYDarBienvenida();
    }
  }, [visible]);

  const cargarYDarBienvenida = async () => {
    setCargando(true);
    let materiasData = [];
    try {
      const data = await fetchAuth('/api/alumnos/mis-calificaciones', {}, token, handleTokenExpired);
      materiasData = parsearCalifs(Array.isArray(data) ? data : []);
      setMaterias(materiasData);
    } catch {}
    finally { setCargando(false); }

    setMensajes([{
      id:   'bienvenida',
      role: 'model',
      text: mensajeBienvenida(usuario?.nombre || 'estudiante', materiasData),
      hora: horaActual(),
    }]);
  };

  const enviar = (textoOverride) => {
    const texto = (textoOverride || input).trim();
    if (!texto || pensando) return;
    setInput('');

    const nuevoMensaje = { id: Date.now().toString(), role: 'user', text: texto, hora: horaActual() };
    setMensajes(prev => {
      const actualizado = [...prev, nuevoMensaje];
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      return actualizado;
    });

    // Simular latencia de "pensando"
    setPensando(true);
    setTimeout(() => {
      const respuesta = generarRespuesta(texto, materias, usuario);
      setMensajes(prev => [...prev, {
        id:   Date.now().toString() + '_bot',
        role: 'model',
        text: respuesta,
        hora: horaActual(),
      }]);
      setPensando(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 600 + Math.random() * 400);
  };

  const chips = sugerenciasContextuales(materias);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <KeyboardAvoidingView
        style={s.chatOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.chatBox}>

          {/* Header */}
          <View style={s.chatHeader}>
            <View style={s.chatHeaderLeft}>
              <View style={s.chatBotAvatar}>
                <Text style={{ fontSize: 22 }}>🤖</Text>
              </View>
              <View>
                <Text style={s.chatBotNombre}>XitaBot</Text>
                <View style={s.chatOnlineRow}>
                  <View style={s.chatOnlineDot} />
                  <Text style={s.chatOnlineTexto}>
                    {cargando ? 'Cargando tu perfil...' : 'En línea'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onCerrar} style={s.chatCerrarBtn}>
              <Text style={s.chatCerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mensajes */}
          {cargando ? (
            <View style={s.cargandoBox}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={s.cargandoTexto}>Cargando tu información académica...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={mensajes}
              keyExtractor={item => item.id}
              contentContainerStyle={s.chatLista}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => <Burbuja mensaje={item} />}
              ListFooterComponent={
                pensando ? (
                  <View style={s.pensandoRow}>
                    <View style={s.botAvatarSmall}>
                      <Text style={{ fontSize: 14 }}>🤖</Text>
                    </View>
                    <View style={s.pensandoBurbuja}>
                      <ActivityIndicator size="small" color="#2E7D32" />
                      <Text style={s.pensandoTexto}>XitaBot está escribiendo...</Text>
                    </View>
                  </View>
                ) : null
              }
            />
          )}

          {/* Chips contextuales — solo al inicio */}
          {!cargando && mensajes.length <= 1 && (
            <View style={s.sugerenciasBox}>
              <Text style={s.sugerenciasTitulo}>Toca una opción para empezar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.sugerenciasRow}>
                  {chips.map(chip => (
                    <TouchableOpacity
                      key={chip}
                      style={s.sugerenciaChip}
                      onPress={() => enviar(chip)}
                    >
                      <Text style={s.sugerenciaChipTexto}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <View style={s.chatInputBox}>
            <TextInput
              style={s.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#aaa"
              multiline
              maxLength={500}
              editable={!pensando && !cargando}
              onSubmitEditing={() => enviar()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[s.chatEnviarBtn, (!input.trim() || pensando) && { opacity: 0.4 }]}
              onPress={() => enviar()}
              disabled={!input.trim() || pensando}
            >
              <Text style={s.chatEnviarIcono}>➤</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Botón flotante (exportación principal) ────────────────
export default function BotFlotante() {
  const [chatAbierto, setChatAbierto] = useState(false);
  const { usuario, token, handleTokenExpired } = useAuth();
  const escala = useRef(new Animated.Value(1)).current;

  const pulsear = () => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start(() => setChatAbierto(true));
  };

  return (
    <>
      <ModalChat
        visible={chatAbierto}
        onCerrar={() => setChatAbierto(false)}
        usuario={usuario}
        token={token}
        handleTokenExpired={handleTokenExpired}
      />
      <Animated.View style={[s.flotante, { transform: [{ scale: escala }] }]}>
        <TouchableOpacity style={s.flotanteBtn} onPress={pulsear} activeOpacity={0.85}>
          <Text style={s.flotanteIcono}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const s = StyleSheet.create({
  // Botón flotante
  flotante:            { position: 'absolute', bottom: 90, right: 20, zIndex: 999 },
  flotanteBtn:         { width: 58, height: 58, borderRadius: 29, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  flotanteIcono:       { fontSize: 26 },
  // Overlay
  chatOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  chatBox:             { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '88%' },
  // Header
  chatHeader:          { backgroundColor: '#2E7D32', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatHeaderLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatBotAvatar:       { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chatBotNombre:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatOnlineRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  chatOnlineDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  chatOnlineTexto:     { color: '#A5D6A7', fontSize: 11 },
  chatCerrarBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  chatCerrarTexto:     { color: '#fff', fontSize: 15, fontWeight: '600' },
  // Lista
  chatLista:           { padding: 16, paddingBottom: 8 },
  cargandoBox:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cargandoTexto:       { fontSize: 13, color: '#888' },
  // Burbujas
  burbujaRow:          { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  burbujaRowBot:       { justifyContent: 'flex-start' },
  burbujaRowUser:      { justifyContent: 'flex-end' },
  botAvatarSmall:      { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  burbuja:             { maxWidth: '78%', borderRadius: 18, padding: 12 },
  burbujaBot:          { backgroundColor: '#F1F8E9', borderBottomLeftRadius: 4 },
  burbujaUser:         { backgroundColor: '#2E7D32', borderBottomRightRadius: 4 },
  burbujaTexto:        { fontSize: 14, lineHeight: 20 },
  burbujaTextoBot:     { color: '#1B5E20' },
  burbujaTextoUser:    { color: '#fff' },
  burbujaHora:         { fontSize: 10, marginTop: 4, textAlign: 'right' },
  // Pensando
  pensandoRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 16 },
  pensandoBurbuja:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F8E9', borderRadius: 18, padding: 12 },
  pensandoTexto:       { fontSize: 13, color: '#558B2F' },
  // Chips
  sugerenciasBox:      { paddingHorizontal: 16, paddingBottom: 8 },
  sugerenciasTitulo:   { fontSize: 11, color: '#aaa', marginBottom: 8 },
  sugerenciasRow:      { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  sugerenciaChip:      { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#C8E6C9' },
  sugerenciaChipTexto: { fontSize: 12, color: '#2E7D32', fontWeight: '500' },
  // Input
  chatInputBox:        { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: '#eee', backgroundColor: '#fff' },
  chatInput:           { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: '#333' },
  chatEnviarBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  chatEnviarIcono:     { color: '#fff', fontSize: 16 },
});
