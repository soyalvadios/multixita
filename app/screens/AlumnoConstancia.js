import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView,
  Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getConstancia } from '../services/api';

const GREEN = '#2E7D32';
const SEM   = {
  verde:    { e:'🟢', label:'Sin factores de riesgo',          color:GREEN },
  amarillo: { e:'🟡', label:'Requiere seguimiento',            color:'#F57F17' },
  rojo:     { e:'🔴', label:'Se recomienda atención especial', color:'#C62828' },
};

export default function AlumnoConstancia({ route, navigation }) {
  const { folio_constancia, puntaje, nivel_riesgo, materia, titulo, folio } = route.params;
  const { token, handleTokenExpired } = useAuth();
  const [constancia, setConstancia] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (folio_constancia) {
      getConstancia(token, folio_constancia, handleTokenExpired)
        .then(d => setConstancia(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [folio_constancia]);

  const sem     = SEM[constancia?.nivel_riesgo || nivel_riesgo] || SEM.amarillo;
  const fechaEm = constancia?.fecha_emision
    ? new Date(constancia.fecha_emision).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

  const compartir = async () => {
    try {
      await Share.share({ message:
        `CONSTANCIA DE ATENCIÓN TUTORIAL\n` +
        `Universidad Mexiquense del Bicentenario — UES Temascalcingo\n\n` +
        `Folio constancia: ${constancia?.folio_constancia || folio_constancia || '—'}\n` +
        `Tutoría: ${folio}\n` +
        `Alumno: ${constancia ? `${constancia.alumno_nombre} ${constancia.alumno_ap}` : '—'}\n` +
        `Matrícula: ${constancia?.matricula || '—'}\n` +
        `Materia: ${constancia?.materia || materia}\n` +
        `Grupo: ${constancia?.grupo || '—'}\n` +
        `Tutor: ${constancia ? `${constancia.docente_nombre} ${constancia.docente_ap}` : '—'}\n` +
        `Parcial: ${constancia?.parcial || '—'}\n` +
        `Fecha: ${fechaEm}\n` +
        `Resultado: ${puntaje ?? constancia?.puntaje_final}% — ${sem.label}\n\n` +
        `Sistema MultiXita · UMB Temascalcingo`
      });
    } catch {}
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={GREEN} style={{ marginTop: 60 }} /> : (
          <>
            <View style={s.documento}>
              <View style={s.docHeader}>
                <Text style={s.docInstitucion}>UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO</Text>
                <Text style={s.docUes}>UES Temascalcingo · Estado de México</Text>
                <View style={s.docDivider} />
                <Text style={s.docTitulo}>CONSTANCIA DE ATENCIÓN TUTORIAL</Text>
              </View>

              <View style={s.docSection}>
                <Text style={s.secLabel}>DATOS DEL ESTUDIANTE</Text>
                {[
                  ['Nombre',     constancia ? `${constancia.alumno_nombre} ${constancia.alumno_ap} ${constancia.alumno_am||''}` : '—'],
                  ['Matrícula',  constancia?.matricula || '—'],
                  ['Grupo',      constancia?.grupo     || '—'],
                ].map(([l,v]) => (
                  <View key={l} style={s.fila}>
                    <Text style={s.filaLabel}>{l}</Text>
                    <Text style={s.filaValor}>{v}</Text>
                  </View>
                ))}
              </View>

              <View style={s.docSection}>
                <Text style={s.secLabel}>DATOS DE LA TUTORÍA</Text>
                {[
                  ['Folio tutoría',    folio],
                  ['Folio constancia', constancia?.folio_constancia || folio_constancia || '—'],
                  ['Título',           constancia?.titulo || titulo || '—'],
                  ['Materia',          `${constancia?.materia || materia} (${constancia?.clave_materia||''})`],
                  ['Docente tutor',    constancia ? `${constancia.docente_nombre} ${constancia.docente_ap}` : '—'],
                  ['Parcial',          String(constancia?.parcial || '—')],
                  ['Fecha',            fechaEm],
                ].map(([l,v]) => (
                  <View key={l} style={s.fila}>
                    <Text style={s.filaLabel}>{l}</Text>
                    <Text style={s.filaValor}>{v}</Text>
                  </View>
                ))}
              </View>

              <View style={[s.resultadoBox, { borderColor: sem.color + '55' }]}>
                <Text style={s.resLabel}>RESULTADO</Text>
                <Text style={s.resEmoji}>{sem.e}</Text>
                <Text style={[s.resNivel, { color: sem.color }]}>{sem.label}</Text>
                <Text style={s.resPts}>{puntaje ?? constancia?.puntaje_final}% de efectividad</Text>
              </View>

              <Text style={s.textoInstitucional}>
                La presente constancia acredita que el estudiante participó satisfactoriamente en una
                sesión de Atención Tutorial en el marco del Programa Institucional de Tutorías de la
                UES Temascalcingo, correspondiente al periodo académico vigente.
              </Text>

              <View style={s.firmaBox}>
                <View style={s.firmaLinea} />
                <Text style={s.firmaNombre}>
                  {constancia ? `${constancia.docente_nombre} ${constancia.docente_ap}` : 'Tutor Responsable'}
                </Text>
                <Text style={s.firmaCargo}>Tutor Responsable · UES Temascalcingo</Text>
              </View>

              <Text style={s.docFooter}>Generado por Sistema MultiXita · UMB Temascalcingo</Text>
            </View>

            <TouchableOpacity style={s.btnCompartir} onPress={compartir}>
              <Text style={s.btnCompartirTxt}>Compartir constancia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnVolver} onPress={() => navigation.navigate('MisTutorias')}>
              <Text style={s.btnVolverTxt}>Volver a mis tutorías</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f5f5f5' },
  scroll:  { padding: 16, paddingBottom: 40 },
  documento: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5,
               borderColor: '#e0e0e0', marginBottom: 14, overflow: 'hidden' },
  docHeader: { backgroundColor: GREEN, padding: 20, alignItems: 'center' },
  docInstitucion: { color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase' },
  docUes:    { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2, textAlign: 'center' },
  docDivider:{ width: 40, height: 0.5, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 10 },
  docTitulo: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
  docSection:{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  secLabel:  { fontSize: 9, fontWeight: '800', color: GREEN, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  fila:      { flexDirection: 'row', marginBottom: 7 },
  filaLabel: { fontSize: 12, color: '#aaa', width: 120 },
  filaValor: { fontSize: 12, color: '#333', flex: 1, fontWeight: '500' },
  resultadoBox: { marginHorizontal: 20, marginVertical: 14, borderWidth: 1.5, borderRadius: 12, padding: 16, alignItems: 'center' },
  resLabel:  { fontSize: 9, fontWeight: '800', color: '#aaa', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  resEmoji:  { fontSize: 32, marginBottom: 4 },
  resNivel:  { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  resPts:    { fontSize: 13, color: '#888' },
  textoInstitucional: { paddingHorizontal: 20, paddingBottom: 14, fontSize: 11, color: '#999', lineHeight: 17, textAlign: 'justify' },
  firmaBox:  { alignItems: 'center', paddingBottom: 16 },
  firmaLinea:{ width: 160, height: 0.5, backgroundColor: '#aaa', marginBottom: 8 },
  firmaNombre:{ fontSize: 12, fontWeight: '700', color: '#333' },
  firmaCargo: { fontSize: 10, color: '#aaa', marginTop: 2 },
  docFooter:  { textAlign: 'center', fontSize: 9, color: '#ccc', paddingBottom: 14, letterSpacing: 0.5 },
  btnCompartir:   { backgroundColor: GREEN, borderRadius: 28, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnCompartirTxt:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  btnVolver:      { borderWidth: 1.5, borderColor: GREEN, borderRadius: 28, paddingVertical: 14, alignItems: 'center' },
  btnVolverTxt:   { color: GREEN, fontWeight: '700' },
});
