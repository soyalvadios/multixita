import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  SafeAreaView, StyleSheet, Text, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAccesos } from '../services/api';

const GREEN = '#2E7D32';

function fmt(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
  catch { return String(ts); }
}

export default function CoordinadorAccesos() {
  const { token, handleTokenExpired } = useAuth();
  const [accesos,    setAccesos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getAccesos(token, handleTokenExpired);
      setAccesos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los accesos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, handleTokenExpired]);

  useEffect(() => { cargar(); }, [cargar]);

  const dentro = accesos.filter(a => a.estado === 'dentro').length;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Accesos</Text>
        <View style={s.headerStats}>
          <View style={s.statChip}>
            <Text style={s.statN}>{dentro}</Text>
            <Text style={s.statL}>dentro</Text>
          </View>
          <View style={[s.statChip, { backgroundColor: '#f5f5f5' }]}>
            <Text style={[s.statN, { color: '#555' }]}>{accesos.length}</Text>
            <Text style={[s.statL, { color: '#888' }]}>total</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <FlatList
          data={accesos}
          keyExtractor={(item, i) => String(item.id_registro || item.id || i)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargar(true); }}
              tintColor={GREEN}
            />
          }
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>Sin registros de acceso</Text>}
          renderItem={({ item }) => {
            const activo = item.estado === 'dentro';
            return (
              <View style={s.card}>
                <View style={[s.dot, { backgroundColor: activo ? GREEN : '#bbb' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.nombre} {item.apellido_paterno}</Text>
                  <Text style={s.meta}>{item.matricula || '—'}</Text>
                  <Text style={s.meta}>⬆ {fmt(item.hora_entrada)}</Text>
                  {!!item.hora_salida && <Text style={s.meta}>⬇ {fmt(item.hora_salida)}</Text>}
                  {!!item.tipo_acceso && <Text style={s.metaFaint}>{item.tipo_acceso}</Text>}
                </View>
                <View style={[s.badge, activo ? s.badgeDentro : s.badgeSalio]}>
                  <Text style={[s.badgeTxt, { color: activo ? GREEN : '#555' }]}>
                    {activo ? 'Dentro' : 'Salió'}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 padding: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  title:       { color: '#1B5E20', fontSize: 24, fontWeight: '800' },
  headerStats: { flexDirection: 'row', gap: 8 },
  statChip:    { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  statN:       { fontSize: 18, fontWeight: '800', color: GREEN },
  statL:       { fontSize: 10, color: '#558B2F', fontWeight: '600' },
  error:       { color: '#C62828', padding: 16 },
  card:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#e0e0e0',
                 padding: 12, flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  dot:         { width: 10, height: 10, borderRadius: 5, marginRight: 10, marginTop: 5 },
  name:        { color: '#1B5E20', fontWeight: '700', fontSize: 14 },
  meta:        { color: '#666', marginTop: 3, fontSize: 12 },
  metaFaint:   { color: '#aaa', marginTop: 2, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge:       { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8, alignSelf: 'flex-start' },
  badgeDentro: { backgroundColor: '#E8F5E9' },
  badgeSalio:  { backgroundColor: '#f5f5f5' },
  badgeTxt:    { fontSize: 11, fontWeight: '700' },
  empty:       { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
