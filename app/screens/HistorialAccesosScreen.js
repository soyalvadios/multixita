import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, getHistorialAccesos } from '../services/api';

const GREEN = '#2E7D32';

function buildFotoUri(u) {
  const arch = u?.foto_selfie || u?.foto;
  if (!arch) return null;
  const base = BASE_URL.replace(/\/$/, '');
  return arch.startsWith('/') ? `${base}${arch}` : `${base}/uploads/fotos/${arch}`;
}

function AvatarHist({ item, size = 52 }) {
  const [err, setErr] = useState(false);
  const uri = buildFotoUri(item);
  const ini = (item?.nombre || '?').charAt(0).toUpperCase();
  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#C8E6C9' }}
        onError={() => setErr(true)}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '800' }}>{ini}</Text>
    </View>
  );
}

function fmtFechaCorta(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const dia = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${dia}, ${hora}`;
}

export default function HistorialAccesosScreen({ navigation }) {
  const { token, handleTokenExpired } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getHistorialAccesos(token, handleTokenExpired);
      setRows(Array.isArray(data) ? data : []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, handleTokenExpired]);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return (
    <SafeAreaView style={s.root}>
      <ActivityIndicator color={GREEN} style={{ marginTop: 50 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Historial de accesos</Text>
        <Text style={s.count}>{rows.length}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id_registro)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(true); }} tintColor={GREEN} />}
        renderItem={({ item }) => {
          const dentro = !item.hora_salida || item.estado === 'dentro';
          return (
            <View style={s.card}>
              <AvatarHist item={item} />
              <View style={s.info}>
                <Text style={s.name}>{item.nombre} {item.apellido_paterno}</Text>
                <Text style={s.meta}>{item.matricula} · {(item.tipo_acceso || 'manual').toUpperCase()}</Text>
                <Text style={s.time}>Entrada: {fmtFechaCorta(item.hora_entrada)}</Text>
                <Text style={s.time}>Salida: {item.hora_salida ? fmtFechaCorta(item.hora_salida) : '—'}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: dentro ? '#E8F5E9' : '#F1F8E9' }]}>
                <Text style={[s.badgeTxt, { color: dentro ? GREEN : '#558B2F' }]}>{dentro ? 'Dentro' : 'Salió'}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>Sin historial reciente</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4f0' },
  header: { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  back: { color: GREEN, fontSize: 16, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', color: '#1B5E20', fontSize: 18, fontWeight: '800' },
  count: { color: '#888', fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#e0e0e0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { color: '#1B5E20', fontSize: 15, fontWeight: '700' },
  meta: { color: '#666', fontSize: 12, marginTop: 2 },
  time: { color: '#999', fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  badgeTxt: { fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 30 },
});
