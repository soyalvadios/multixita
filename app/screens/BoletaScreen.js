import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, SafeAreaView,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchAuth } from '../services/api';

const GREEN = '#2E7D32';

function CalifBadge({ valor }) {
  const aprobado = valor >= 70;
  return (
    <View style={[cb.badge, aprobado ? cb.aprobado : cb.reprobado]}>
      <Text style={[cb.txt, aprobado ? cb.txtAprobado : cb.txtReprobado]}>{valor}</Text>
    </View>
  );
}
const cb = StyleSheet.create({
  badge:       { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, minWidth: 40, alignItems: 'center' },
  aprobado:    { backgroundColor: '#E8F5E9' },
  reprobado:   { backgroundColor: '#FFEBEE' },
  txt:         { fontSize: 17, fontWeight: '800' },
  txtAprobado: { color: GREEN },
  txtReprobado:{ color: '#C62828' },
});

export default function BoletaScreen() {
  const { token, usuario, handleTokenExpired } = useAuth();
  const [califs,     setCalifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await fetchAuth('/api/alumnos/mis-calificaciones', {}, token, handleTokenExpired);
      setCalifs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Error al cargar la boleta');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  // Agrupar por materia
  const materias = califs.reduce((acc, c) => {
    const k = c.materia || 'Materia';
    if (!acc[k]) acc[k] = { materia: k, clave: c.clave_materia, docente: c.docente, parciales: [] };
    acc[k].parciales.push(c);
    return acc;
  }, {});

  // Promedio global
  const promedio = califs.length
    ? (califs.reduce((s, c) => s + (c.calificacion || 0), 0) / califs.length).toFixed(1)
    : null;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitulo}>Mi Boleta</Text>
          <Text style={s.headerSub}>{usuario?.nombre} {usuario?.apellido_paterno}</Text>
        </View>
        {promedio !== null && (
          <View style={s.promedioBox}>
            <Text style={s.promedioNum}>{promedio}</Text>
            <Text style={s.promedioLabel}>promedio</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {error}</Text></View>
      ) : (
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
          {Object.values(materias).length === 0 ? (
            <View style={s.vacioBox}>
              <Text style={s.vacioEmoji}>📋</Text>
              <Text style={s.vacioTitulo}>Sin calificaciones registradas</Text>
              <Text style={s.vacioSub}>Las calificaciones aparecerán aquí cuando el docente las capture.</Text>
            </View>
          ) : (
            Object.values(materias).map(m => {
              const promedioMat = m.parciales.length
                ? (m.parciales.reduce((s, p) => s + (p.calificacion || 0), 0) / m.parciales.length).toFixed(1)
                : null;
              return (
                <View key={m.materia} style={s.materiaCard}>
                  {/* Encabezado materia */}
                  <View style={s.materiaHeader}>
                    <View style={{ flex: 1 }}>
                      {!!m.clave && (
                        <View style={s.claveTag}><Text style={s.claveTxt}>{m.clave}</Text></View>
                      )}
                      <Text style={s.materiaNombre}>{m.materia}</Text>
                      {!!m.docente && <Text style={s.materiaDocente}>Docente: {m.docente}</Text>}
                    </View>
                    {promedioMat !== null && (
                      <View style={s.promedioMatBox}>
                        <Text style={[s.promedioMatNum, { color: Number(promedioMat) >= 70 ? GREEN : '#C62828' }]}>
                          {promedioMat}
                        </Text>
                        <Text style={s.promedioMatLabel}>promedio</Text>
                      </View>
                    )}
                  </View>

                  {/* Parciales */}
                  {m.parciales
                    .sort((a, b) => (a.parcial || 0) - (b.parcial || 0))
                    .map((p, i) => (
                      <View key={i} style={s.parcialRow}>
                        <Text style={s.parcialLabel}>Parcial {p.parcial}</Text>
                        <View style={{ flex: 1 }}>
                          {!!p.asistencias && (
                            <Text style={s.asistencias}>🗓 {p.asistencias}</Text>
                          )}
                          {!!p.fecha_captura && (
                            <Text style={s.fechaCaptura}>
                              {new Date(p.fecha_captura).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}
                            </Text>
                          )}
                        </View>
                        <CalifBadge valor={p.calificacion} />
                      </View>
                    ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { backgroundColor: GREEN, paddingTop: 16, paddingBottom: 18,
                      paddingHorizontal: 20, flexDirection: 'row',
                      justifyContent: 'space-between', alignItems: 'center' },
  headerTitulo:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:        { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 },
  promedioBox:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
                      padding: 10, alignItems: 'center', minWidth: 64 },
  promedioNum:      { color: '#fff', fontSize: 22, fontWeight: '800' },
  promedioLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 1 },
  scroll:           { padding: 16, paddingBottom: 32 },
  errorBox:         { backgroundColor: '#FFEBEE', margin: 16, borderRadius: 12, padding: 14 },
  errorTxt:         { color: '#C62828', fontSize: 14 },
  vacioBox:         { alignItems: 'center', paddingTop: 60 },
  vacioEmoji:       { fontSize: 48, marginBottom: 12 },
  vacioTitulo:      { fontSize: 16, fontWeight: '700', color: '#333' },
  vacioSub:         { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center',
                      paddingHorizontal: 24, lineHeight: 20 },
  materiaCard:      { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
                      borderWidth: 0.5, borderColor: '#e0e0e0', overflow: 'hidden' },
  materiaHeader:    { padding: 14, flexDirection: 'row', alignItems: 'flex-start',
                      borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
                      backgroundColor: '#FAFFFE' },
  claveTag:         { backgroundColor: '#1B5E20', borderRadius: 6, paddingHorizontal: 8,
                      paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  claveTxt:         { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  materiaNombre:    { fontSize: 15, fontWeight: '700', color: '#1B5E20' },
  materiaDocente:   { fontSize: 12, color: '#888', marginTop: 3 },
  promedioMatBox:   { alignItems: 'center', backgroundColor: '#F1F8E9', borderRadius: 10,
                      paddingHorizontal: 12, paddingVertical: 8, marginLeft: 12 },
  promedioMatNum:   { fontSize: 20, fontWeight: '800' },
  promedioMatLabel: { fontSize: 10, color: '#888', marginTop: 1 },
  parcialRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                      paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  parcialLabel:     { fontSize: 14, color: '#555', fontWeight: '600', width: 80 },
  asistencias:      { fontSize: 11, color: '#888' },
  fechaCaptura:     { fontSize: 10, color: '#aaa', marginTop: 1 },
});
