import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getResumenTutoriasAdmin } from '../services/api';

const GREEN = '#2E7D32';

export default function DocenteDashboard({ navigation }) {
  const { usuario, logout, token, handleTokenExpired } = useAuth();
  const [resumen, setResumen]   = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getResumenTutoriasAdmin(token, handleTokenExpired)
      .then(d => setResumen(d.totales))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.saludo}>Hola, {usuario?.nombre?.split(' ')[0]}</Text>
          <Text style={s.headerSub}>Módulo de Tutorías · MultiXita</Text>
        </View>
        <TouchableOpacity onPress={() =>
          Alert.alert('Cerrar sesión','¿Salir?',[
            { text:'Cancelar', style:'cancel' },
            { text:'Salir', style:'destructive', onPress: logout },
          ])}>
          <Text style={s.salirTxt}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.seccion}>Resumen de tutorías</Text>
        {cargando ? <ActivityIndicator color={GREEN} style={{ marginTop: 24 }} /> : (
          <View style={s.grid}>
            {[
              { label:'Total',         valor: resumen?.total_tutorias   ?? 0, color: GREEN },
              { label:'Participantes', valor: resumen?.total_participantes??0, color:'#1565C0'},
              { label:'Pendientes',    valor: resumen?.pendientes        ?? 0, color:'#F57F17'},
              { label:'Respondidas',   valor: resumen?.respondidas       ?? 0, color: GREEN },
              { label:'🔴 Riesgo',      valor: resumen?.riesgo_rojo       ?? 0, color:'#C62828'},
              { label:'🟡 Seguimiento', valor: resumen?.riesgo_amarillo   ?? 0, color:'#F57F17'},
            ].map(item => (
              <View key={item.label} style={[s.statCard, { borderLeftColor: item.color }]}>
                <Text style={[s.statValor, { color: item.color }]}>{item.valor}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.btnPrimario}
          onPress={() => navigation.navigate('Tutorías', { screen:'NuevaTutoria' })}>
          <Text style={s.btnTxt}>+ Nueva tutoría</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecundario}
          onPress={() => navigation.navigate('Tutorías', { screen:'ListaTutorias' })}>
          <Text style={s.btnSecTxt}>Ver mis tutorías</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  saludo:       { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  salirTxt:     { color: '#ffcdd2', fontWeight: '600' },
  scroll:       { padding: 16, paddingBottom: 32 },
  seccion:      { fontSize: 13, fontWeight: '600', color: '#558B2F', textTransform: 'uppercase',
                  letterSpacing: 0.5, marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:     { width: '47.5%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  borderWidth: 0.5, borderColor: '#eee', borderLeftWidth: 3 },
  statValor:    { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel:    { fontSize: 12, color: '#888' },
  btnPrimario:  { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14,
                  alignItems: 'center', marginBottom: 10 },
  btnTxt:       { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecundario:{ borderWidth: 1.5, borderColor: GREEN, borderRadius: 12,
                  paddingVertical: 14, alignItems: 'center' },
  btnSecTxt:    { color: GREEN, fontWeight: '700', fontSize: 15 },
});
