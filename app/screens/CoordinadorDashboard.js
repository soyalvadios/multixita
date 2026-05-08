import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl,
  SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAccesos, getAlumnos } from '../services/api';

const GREEN = '#2E7D32';

function StatCard({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color || GREEN }]}>
      <Text style={[s.statValue, { color: color || GREEN }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function CoordinadorDashboard() {
  const { token, usuario, logout, handleTokenExpired } = useAuth();
  const [alumnos,    setAlumnos]    = useState([]);
  const [accesos,    setAccesos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [a, b] = await Promise.all([
        getAlumnos(token, handleTokenExpired).catch(() => []),
        getAccesos(token, handleTokenExpired).catch(() => []),
      ]);
      setAlumnos(Array.isArray(a) ? a : []);
      setAccesos(Array.isArray(b) ? b : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const stats = useMemo(() => {
    // CRITERIO UNIFICADO con CoordinadorAlumnos: exactamente 'pendiente'
    const pendientes  = alumnos.filter(x =>
      (x.estado_verificacion_facial || 'sin_selfie') === 'pendiente'
    ).length;
    const verificados = alumnos.filter(x =>
      x.identidad_verificada && x.estado_verificacion_facial === 'aprobada'
    ).length;
    const dentro = accesos.filter(x => x.estado === 'dentro').length;
    return { total: alumnos.length, pendientes, verificados, dentro };
  }, [alumnos, accesos]);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(true); }}
            tintColor={GREEN}
          />
        }
      >
        <View style={s.header}>
          <View>
            <Text style={s.title}>Hola, {usuario?.nombre?.split(' ')[0] || 'Admin'}</Text>
            <Text style={s.sub}>Panel administrativo · MultiXita</Text>
          </View>
          <TouchableOpacity onPress={() =>
            Alert.alert('Cerrar sesión', '¿Quieres salir?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: logout },
            ])
          }>
            <Text style={s.logout}>Salir</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={s.grid}>
              <StatCard label="Alumnos"     value={stats.total}       color={GREEN} />
              <StatCard label="Verificados" value={stats.verificados} color="#1565C0" />
              <StatCard label="Pendientes"  value={stats.pendientes}  color="#F57F17" />
              <StatCard label="Dentro"      value={stats.dentro}      color="#558B2F" />
            </View>

            {stats.pendientes > 0 && (
              <View style={s.alertBox}>
                <Text style={s.alertIcono}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitulo}>
                    {stats.pendientes} solicitud{stats.pendientes > 1 ? 'es' : ''} pendiente{stats.pendientes > 1 ? 's' : ''}
                  </Text>
                  <Text style={s.alertSub}>
                    Ve a Alumnos para revisar y aprobar identidades.
                  </Text>
                </View>
              </View>
            )}

            <View style={s.panel}>
              <Text style={s.panelTitle}>¿Qué puedes hacer?</Text>
              <Text style={s.panelText}>
                {'• '}
                <Text style={{ fontWeight: '700' }}>Alumnos:</Text>
                {' revisa solicitudes, aprueba o rechaza identidad con motivo.\n• '}
                <Text style={{ fontWeight: '700' }}>Accesos:</Text>
                {' historial de entradas y salidas al campus.\n• '}
                <Text style={{ fontWeight: '700' }}>Gestión:</Text>
                {' agrega docentes y asigna materias y grupos.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f5f5f5' },
  scroll:      { padding: 16, paddingBottom: 32 },
  header:      { backgroundColor: GREEN, borderRadius: 16, padding: 18, marginBottom: 16,
                 flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:       { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub:         { color: 'rgba(255,255,255,0.75)', marginTop: 3, fontSize: 12 },
  logout:      { color: '#ffcdd2', fontWeight: '700', fontSize: 13 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard:    { width: '47.5%', backgroundColor: '#fff', borderRadius: 14, padding: 16,
                 borderWidth: 0.5, borderColor: '#e0e0e0', borderLeftWidth: 3 },
  statValue:   { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel:   { color: '#666', fontSize: 13 },
  alertBox:    { backgroundColor: '#FFF8E1', borderRadius: 14, padding: 14,
                 flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                 marginBottom: 14, borderWidth: 1, borderColor: '#FFE082' },
  alertIcono:  { fontSize: 22 },
  alertTitulo: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  alertSub:    { fontSize: 12, color: '#BF360C', marginTop: 3, lineHeight: 18 },
  panel:       { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                 borderWidth: 0.5, borderColor: '#e0e0e0' },
  panelTitle:  { color: GREEN, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  panelText:   { color: '#555', lineHeight: 22, fontSize: 13 },
});
