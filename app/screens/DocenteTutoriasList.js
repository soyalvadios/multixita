import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMisTutoriasDocente } from '../services/api';

const GREEN = '#2E7D32';
const SEM   = { verde:'#2E7D32', amarillo:'#F57F17', rojo:'#C62828' };
const SEME  = { verde:'🟢', amarillo:'🟡', rojo:'🔴' };
const ECOL  = { borrador:'#888', publicada:'#2E7D32', cerrada:'#1565C0' };

export default function DocenteTutoriasList({ navigation }) {
  const { token, handleTokenExpired } = useAuth();
  const [tutorias,   setTutorias]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await getMisTutoriasDocente(token, handleTokenExpired);
      setTutorias(Array.isArray(d) ? d : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.titulo}>Mis tutorías</Text>
        <TouchableOpacity style={s.btnNueva} onPress={() => navigation.navigate('NuevaTutoria')}>
          <Text style={s.btnNuevaTxt}>+ Nueva</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} /> :
       error   ? <Text style={s.error}>{error}</Text> : (
        <FlatList data={tutorias} keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(true); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTxt}>Sin tutorías registradas</Text>
              <Text style={s.emptySub}>Presiona "+ Nueva" para crear una</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card}
              onPress={() => navigation.navigate('DetalleTutoria', { id: item.id })}>
              <View style={s.cardTop}>
                <View style={s.tagClave}><Text style={s.tagClaveTxt}>{item.clave_materia}</Text></View>
                <Text style={s.folio}>{item.folio}</Text>
                <View style={[s.estatusBadge, { backgroundColor: (ECOL[item.estatus]||'#888')+'22' }]}>
                  <Text style={[s.estatusTxt, { color: ECOL[item.estatus]||'#888' }]}>{item.estatus}</Text>
                </View>
              </View>
              <Text style={s.alumnoNombre}>{item.materia}</Text>
              <Text style={s.meta}>{item.grupo} · Parcial {item.parcial} · {new Date(item.fecha_publicacion).toLocaleDateString('es-MX')}</Text>
              <Text style={s.motivo} numberOfLines={1}>{item.titulo}</Text>
              <Text style={s.progreso}>{item.respondidas||0}/{item.total_alumnos||0} respondidas</Text>
              {item.riesgo_rojo > 0 && <Text style={{ color:'#C62828', fontSize:12, marginTop:4 }}>🔴 {item.riesgo_rojo} en riesgo alto</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titulo:       { color: '#fff', fontSize: 20, fontWeight: '700' },
  btnNueva:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  btnNuevaTxt:  { color: '#fff', fontWeight: '700' },
  error:        { color: '#C62828', padding: 16 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#eee' },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  tagClave:     { backgroundColor: '#1B5E20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagClaveTxt:  { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  folio:        { fontSize: 11, color: '#aaa' },
  estatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  estatusTxt:   { fontSize: 11, fontWeight: '700' },
  alumnoNombre: { fontSize: 15, fontWeight: '700', color: '#333' },
  meta:         { fontSize: 12, color: '#888', marginTop: 2 },
  motivo:       { fontSize: 13, color: '#555', marginTop: 4 },
  progreso:     { fontSize: 12, color: GREEN, fontWeight: '600', marginTop: 4 },
  emptyBox:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTxt:     { fontSize: 16, fontWeight: '700', color: '#333' },
  emptySub:     { fontSize: 13, color: '#888', marginTop: 4 },
});
