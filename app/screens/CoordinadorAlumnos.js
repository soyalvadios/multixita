import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  SafeAreaView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, getAlumnos } from '../services/api';

const GREEN = '#2E7D32';

const BADGE = {
  aprobada:  { bg: '#E8F5E9', txt: '#1B5E20', label: 'Aprobada' },
  pendiente: { bg: '#FFF8E1', txt: '#E65100', label: 'Pendiente' },
  rechazada: { bg: '#FFEBEE', txt: '#C62828', label: 'Rechazada' },
  sin_selfie:{ bg: '#F5F5F5', txt: '#757575', label: 'Sin foto' },
};

function Avatar({ alumno }) {
  const archivo = alumno?.foto_selfie || alumno?.foto;
  const uri = archivo
    ? (archivo.startsWith('http') ? archivo : `${BASE_URL}${archivo}`)
    : null;
  if (uri) return <Image source={{ uri }} style={s.avatar} />;
  return (
    <View style={[s.avatar, s.avatarFallback]}>
      <Text style={s.avatarLetter}>{(alumno?.nombre || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function CoordinadorAlumnos({ navigation }) {
  const { token, handleTokenExpired } = useAuth();
  const [alumnos,    setAlumnos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query,      setQuery]      = useState('');
  const [error,      setError]      = useState('');
  const [filtro,     setFiltro]     = useState('todos'); // todos|pendiente|aprobada|rechazada

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getAlumnos(token, handleTokenExpired);
      setAlumnos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los alumnos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, handleTokenExpired]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    let base = alumnos;
    if (filtro !== 'todos') {
      base = base.filter(a => (a.estado_verificacion_facial || 'sin_selfie') === filtro);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(a =>
        `${a.nombre} ${a.apellido_paterno} ${a.matricula}`.toLowerCase().includes(q)
      );
    }
    return base;
  }, [alumnos, query, filtro]);

  const pendientesN = alumnos.filter(a => a.estado_verificacion_facial === 'pendiente').length;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Alumnos</Text>
        <Text style={s.count}>{filtrados.length} resultados</Text>
      </View>

      {/* Filtros rápidos */}
      <View style={s.filtrosRow}>
        {[
          { key:'todos',    label:'Todos' },
          { key:'pendiente',label:`Pendientes ${pendientesN > 0 ? `(${pendientesN})` : ''}` },
          { key:'aprobada', label:'Aprobados' },
          { key:'rechazada',label:'Rechazados' },
        ].map(f => (
          <TouchableOpacity key={f.key}
            style={[s.filtroBtn, filtro === f.key && s.filtroBtnActivo]}
            onPress={() => setFiltro(f.key)}>
            <Text style={[s.filtroTxt, filtro === f.key && s.filtroTxtActivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre o matrícula…"
        placeholderTextColor="#aaa"
      />

      {loading ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item, i) => String(item.id_usuario || i)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargar(true); }}
              tintColor={GREEN}
            />
          }
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <Text style={s.empty}>Sin resultados</Text>
          }
          renderItem={({ item: a }) => {
            const estado = a.estado_verificacion_facial || 'sin_selfie';
            const badge  = BADGE[estado] || BADGE.sin_selfie;
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AlumnoDetalle', { alumno: a })}
              >
                <Avatar alumno={a} />
                <View style={s.info}>
                  <Text style={s.name}>{a.nombre} {a.apellido_paterno}</Text>
                  <Text style={s.meta}>{a.matricula || 'Sin matrícula'}</Text>
                  {!!a.carrera && <Text style={s.meta} numberOfLines={1}>{a.carrera}</Text>}
                </View>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.badgeTxt, { color: badge.txt }]}>{badge.label}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:         { color: '#1B5E20', fontSize: 24, fontWeight: '800' },
  count:         { color: '#888', fontSize: 13 },
  filtrosRow:    { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' },
  filtroBtn:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                   backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  filtroBtnActivo:{ backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filtroTxt:     { fontSize: 12, color: '#666', fontWeight: '600' },
  filtroTxtActivo:{ color: '#fff' },
  input:         { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff',
                   borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0',
                   color: '#333', padding: 12, fontSize: 14 },
  error:         { color: '#C62828', padding: 16 },
  card:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5,
                   borderColor: '#e0e0e0', padding: 12, flexDirection: 'row',
                   alignItems: 'center', marginBottom: 10 },
  avatar:        { width: 48, height: 48, borderRadius: 24 },
  avatarFallback:{ backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:  { color: '#fff', fontWeight: '700', fontSize: 18 },
  info:          { flex: 1, marginLeft: 12 },
  name:          { color: '#1B5E20', fontWeight: '700', fontSize: 15 },
  meta:          { color: '#666', marginTop: 3, fontSize: 12 },
  badge:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeTxt:      { fontSize: 11, fontWeight: '700' },
  empty:         { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
