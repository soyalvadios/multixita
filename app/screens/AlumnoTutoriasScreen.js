import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMisTutoriasAlumno } from '../services/api';

const GREEN = '#2E7D32';
const SEM   = { verde:{color:GREEN,bg:'#E8F5E9',e:'🟢'}, amarillo:{color:'#F57F17',bg:'#FFF8E1',e:'🟡'}, rojo:{color:'#C62828',bg:'#FFEBEE',e:'🔴'} };

export default function AlumnoTutoriasScreen({ navigation }) {
  const { token, handleTokenExpired } = useAuth();
  const [tutorias,   setTutorias]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (s=false) => {
    if (!s) setLoading(true);
    try { const d = await getMisTutoriasAlumno(token, handleTokenExpired); setTutorias(Array.isArray(d)?d:[]); }
    catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const pendientes = tutorias.filter(t => t.estado === 'pendiente');

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.titulo}>Mis tutorías</Text>
        {pendientes.length > 0 && (
          <View style={s.alertBadge}><Text style={s.alertBadgeTxt}>{pendientes.length} pendiente(s)</Text></View>
        )}
      </View>
      {loading ? <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} /> : (
        <FlatList data={tutorias} keyExtractor={i => String(i.id_tutoria_alumno)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(true); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={s.vacioBox}>
              <Text style={s.vacioEmoji}>📋</Text>
              <Text style={s.vacioTitulo}>Sin tutorías asignadas</Text>
              <Text style={s.vacioSub}>Cuando tu docente publique una tutoría aparecerá aquí</Text>
            </View>
          }
          renderItem={({ item }) => {
            const pendiente = item.estado === 'pendiente';
            const sem = item.nivel_riesgo ? SEM[item.nivel_riesgo] : null;
            return (
              <TouchableOpacity style={[s.card, pendiente && s.cardPendiente]} activeOpacity={0.8}
                onPress={() => pendiente
                  ? navigation.navigate('Cuestionario', {
                      id_tutoria_alumno: item.id_tutoria_alumno,
                      folio:   item.folio,
                      materia: item.materia,
                      titulo:  item.titulo,
                    })
                  : navigation.navigate('Constancia', {
                      folio_constancia: item.folio_constancia,
                      puntaje:          item.puntaje_total,
                      nivel_riesgo:     item.nivel_riesgo,
                      materia:          item.materia,
                      titulo:           item.titulo,
                      folio:            item.folio,
                    })
                }>
                <View style={s.cardTop}>
                  <View style={s.tagClave}><Text style={s.tagClaveTxt}>{item.clave_materia}</Text></View>
                  <Text style={s.folio}>{item.folio}</Text>
                  {pendiente && <View style={s.tagPend}><Text style={s.tagPendTxt}>⚠️ Responder</Text></View>}
                </View>
                <Text style={s.materiaNombre}>{item.materia}</Text>
                <Text style={s.cardMeta}>{item.grupo} · Parcial {item.parcial}</Text>
                <Text style={s.cardMeta}>Tutor: {item.docente_nombre} {item.docente_ap}</Text>
                <Text style={s.cardTitulo}>"{item.titulo}"</Text>
                {sem && <View style={[s.semResult, { backgroundColor: sem.bg }]}>
                  <Text style={[s.semResultTxt, { color: sem.color }]}>{sem.e} {item.puntaje_total}% — {item.nivel_riesgo}</Text>
                </View>}
                {pendiente && <Text style={s.tapHint}>Toca para responder el cuestionario →</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: '#2E7D32', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo:       { color: '#fff', fontSize: 20, fontWeight: '700' },
  alertBadge:   { backgroundColor: '#C62828', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  alertBadgeTxt:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  vacioBox:     { alignItems: 'center', paddingTop: 60 },
  vacioEmoji:   { fontSize: 48, marginBottom: 12 },
  vacioTitulo:  { fontSize: 16, fontWeight: '700', color: '#333' },
  vacioSub:     { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#e0e0e0' },
  cardPendiente:{ borderColor: '#F57F17', borderWidth: 1.5 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  tagClave:     { backgroundColor: '#1B5E20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagClaveTxt:  { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  folio:        { fontSize: 11, color: '#aaa' },
  tagPend:      { backgroundColor: '#FFF8E1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagPendTxt:   { color: '#E65100', fontSize: 11, fontWeight: '600' },
  materiaNombre:{ fontSize: 15, fontWeight: '700', color: '#1B5E20', marginBottom: 3 },
  cardMeta:     { fontSize: 12, color: '#888', lineHeight: 18 },
  cardTitulo:   { fontSize: 13, color: '#555', fontStyle: 'italic', marginTop: 4 },
  semResult:    { borderRadius: 8, padding: 8, marginTop: 8 },
  semResultTxt: { fontSize: 13, fontWeight: '700' },
  tapHint:      { fontSize: 12, color: '#2E7D32', fontWeight: '600', marginTop: 8 },
});
