import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCuestionario, responderCuestionario } from '../services/api';

const GREEN = '#2E7D32';

export default function AlumnoCuestionario({ route, navigation }) {
  const { id_tutoria_alumno, folio, materia, titulo } = route.params;
  const { token, handleTokenExpired } = useAuth();
  const [preguntas,  setPreguntas]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [respuestas, setRespuestas] = useState({});
  const [pregActual, setPregActual] = useState(0);
  const [enviando,   setEnviando]   = useState(false);

  useEffect(() => {
    getCuestionario(token, id_tutoria_alumno, handleTokenExpired)
      .then(d => setPreguntas(Array.isArray(d?.preguntas) ? d.preguntas : []))
      .catch(e => { Alert.alert('Error', e.message); navigation.goBack(); })
      .finally(() => setLoading(false));
  }, []);

  const seleccionar = (id_preg, opcion) =>
    setRespuestas(prev => ({ ...prev, [id_preg]: { id_opcion: opcion.id, texto_opcion: opcion.texto } }));

  const siguiente = () => {
    const p = preguntas[pregActual];
    if (!respuestas[p.id]) { Alert.alert('Selecciona una opción'); return; }
    if (pregActual < preguntas.length - 1) setPregActual(i => i + 1);
  };

  const enviar = async () => {
    const p = preguntas[pregActual];
    if (!respuestas[p.id]) { Alert.alert('Selecciona una opción'); return; }
    const lista = Object.entries(respuestas).map(([id_pregunta, r]) => ({
      id_pregunta: parseInt(id_pregunta),
      id_opcion: r.id_opcion,
      texto_opcion: r.texto_opcion,
    }));
    setEnviando(true);
    try {
      const result = await responderCuestionario(token, id_tutoria_alumno, lista, handleTokenExpired);
      navigation.replace('Constancia', {
        folio_constancia: result.folio_constancia,
        puntaje:          result.puntaje,
        nivel_riesgo:     result.nivel_riesgo,
        materia, titulo, folio,
      });
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setEnviando(false); }
  };

  if (loading) return <SafeAreaView style={s.root}><ActivityIndicator color={GREEN} style={{ marginTop: 60 }} /></SafeAreaView>;

  if (!preguntas.length) return (
    <SafeAreaView style={s.root}>
      <View style={s.vacioBox}>
        <Text style={s.vacioTxt}>Esta tutoría no tiene preguntas.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.volverTxt}>Volver</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const pregunta   = preguntas[pregActual];
  const total      = preguntas.length;
  const respondidas= Object.keys(respuestas).length;
  const progreso   = Math.round((respondidas / total) * 100);
  const esUltima   = pregActual === total - 1;
  const LETRAS     = ['A','B','C','D','E'];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.headerFolio}>{folio}</Text>
        <Text style={s.headerProg}>{respondidas}/{total} respondidas</Text>
      </View>
      <View style={s.barraFondo}><View style={[s.barraRelleno, { width:`${progreso}%` }]} /></View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.tagMat}><Text style={s.tagMatTxt}>{materia}</Text></View>
            <Text style={s.numPrg}>Pregunta {pregActual+1} de {total}</Text>
          </View>
          <Text style={s.preguntaTxt}>{pregunta.pregunta}</Text>

          <View style={s.opcionesBox}>
            {(pregunta.opciones||[]).map((op, i) => {
              const sel = respuestas[pregunta.id]?.id_opcion === op.id;
              return (
                <TouchableOpacity key={op.id} style={[s.opcion, sel && s.opcionSel]}
                  onPress={() => seleccionar(pregunta.id, op)} activeOpacity={0.8}>
                  <View style={[s.radio, sel && s.radioSel]}>
                    {sel && <View style={s.radioInner} />}
                  </View>
                  <Text style={[s.letraOp, sel && s.letraOpSel]}>{LETRAS[i]}.</Text>
                  <Text style={[s.opTxt, sel && s.opTxtSel]} numberOfLines={3}>{op.texto}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.navRow}>
            {pregActual > 0 && (
              <TouchableOpacity style={s.btnAtras} onPress={() => setPregActual(i => i-1)}>
                <Text style={s.btnAtrasTxt}>‹ Anterior</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {!esUltima ? (
              <TouchableOpacity style={s.btnSig} onPress={siguiente}>
                <Text style={s.btnSigTxt}>Siguiente ›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.btnEnviar, enviando && { opacity:0.6 }]}
                onPress={enviar} disabled={enviando}>
                {enviando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnEnviarTxt}>Enviar ✓</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mapa de progreso */}
        <View style={s.mapaRow}>
          {preguntas.map((p, i) => (
            <TouchableOpacity key={p.id}
              style={[s.mapaDot, respuestas[p.id] && s.mapaDotResp, i===pregActual && s.mapaDotActual]}
              onPress={() => setPregActual(i)}>
              <Text style={[s.mapaDotTxt, (i===pregActual||respuestas[p.id]) && { color:'#fff' }]}>{i+1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { backgroundColor: GREEN, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 20,
                 flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerFolio: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerProg:  { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  barraFondo:  { height: 5, backgroundColor: '#C8E6C9' },
  barraRelleno:{ height: 5, backgroundColor: GREEN },
  scroll:      { padding: 16, paddingBottom: 32 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e0e0e0', marginBottom: 12 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagMat:      { backgroundColor: '#1B5E20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagMatTxt:   { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  numPrg:      { fontSize: 11, color: '#aaa', fontWeight: '600' },
  preguntaTxt: { fontSize: 16, fontWeight: '600', color: '#1B5E20', lineHeight: 24, marginBottom: 18 },
  opcionesBox: { gap: 10, marginBottom: 18 },
  opcion:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa' },
  opcionSel:   { borderColor: GREEN, backgroundColor: '#F1F8E9' },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc' },
  radioSel:    { borderColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  radioInner:  { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  letraOp:     { fontSize: 13, fontWeight: '700', color: '#aaa', minWidth: 20 },
  letraOpSel:  { color: GREEN },
  opTxt:       { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  opTxtSel:    { color: '#1B5E20', fontWeight: '600' },
  navRow:      { flexDirection: 'row', alignItems: 'center' },
  btnAtras:    { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  btnAtrasTxt: { color: '#555', fontWeight: '600' },
  btnSig:      { backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  btnSigTxt:   { color: '#fff', fontWeight: '700' },
  btnEnviar:   { backgroundColor: '#1B5E20', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnEnviarTxt:{ color: '#fff', fontWeight: '700' },
  mapaRow:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  mapaDot:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  mapaDotResp: { backgroundColor: '#A5D6A7' },
  mapaDotActual:{ backgroundColor: GREEN },
  mapaDotTxt:  { fontSize: 11, fontWeight: '600', color: '#555' },
  vacioBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  vacioTxt:    { color: '#888', fontSize: 15, marginBottom: 16 },
  volverTxt:   { color: GREEN, fontWeight: '700', fontSize: 14 },
});
