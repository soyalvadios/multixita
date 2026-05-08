import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDetalleTutoria, cerrarTutoria, publicarTutoriaBorrador } from '../services/api';

const GREEN = '#2E7D32';
const SEM   = {
  verde:    { bg:'#E8F5E9', color:GREEN,     e:'🟢', label:'Sin riesgo' },
  amarillo: { bg:'#FFF8E1', color:'#F57F17', e:'🟡', label:'Seguimiento' },
  rojo:     { bg:'#FFEBEE', color:'#C62828', e:'🔴', label:'Riesgo alto' },
};

export default function DocenteTutoriaDetalle({ route, navigation }) {
  const { id } = route.params;
  const { token, handleTokenExpired } = useAuth();
  const [detalle,    setDetalle]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accionando, setAccionando] = useState(false);

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await getDetalleTutoria(token, id, handleTokenExpired);
      setDetalle(d);
    } catch (e) { Alert.alert('Error', e.message); navigation.goBack(); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, id]);

  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (tipo) => {
    Alert.alert(
      tipo === 'cerrar' ? 'Cerrar tutoría' : 'Publicar tutoría',
      tipo === 'cerrar'
        ? 'Los alumnos ya no podrán responder. ¿Continuar?'
        : '¿Publicar y notificar alumnos del grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: tipo === 'cerrar' ? 'Cerrar' : 'Publicar',
          style: tipo === 'cerrar' ? 'destructive' : 'default',
          onPress: async () => {
            setAccionando(true);
            try {
              if (tipo === 'cerrar') await cerrarTutoria(token, id, handleTokenExpired);
              else await publicarTutoriaBorrador(token, id, handleTokenExpired);
              await cargar(true);
            } catch (e) { Alert.alert('Error', e.message); }
            finally { setAccionando(false); }
          },
        },
      ]
    );
  };

  if (loading) return (
    <SafeAreaView style={s.root}><ActivityIndicator color={GREEN} style={{ marginTop: 60 }} /></SafeAreaView>
  );
  if (!detalle) return null;

  const alumnos     = detalle.alumnos || [];
  const respondidas = alumnos.filter(a => a.estado === 'respondida').length;
  const pct         = alumnos.length ? Math.round((respondidas / alumnos.length) * 100) : 0;
  const semConteo   = alumnos.reduce((acc, a) => {
    if (a.nivel_riesgo) acc[a.nivel_riesgo] = (acc[a.nivel_riesgo] || 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Text style={s.backTxt}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerFolio}>{detalle.folio}</Text>
          <Text style={s.headerMat}>{detalle.materia} · {detalle.grupo}</Text>
        </View>
        <View style={[s.estatusBadge, {
          backgroundColor: detalle.estatus === 'publicada' ? '#E8F5E9' : detalle.estatus === 'cerrada' ? '#E3F2FD' : '#f5f5f5',
        }]}>
          <Text style={[s.estatusTxt, {
            color: detalle.estatus === 'publicada' ? GREEN : detalle.estatus === 'cerrada' ? '#1565C0' : '#888',
          }]}>{detalle.estatus}</Text>
        </View>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={a => String(a.id_alumno)}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); cargar(true); }} tintColor={GREEN} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={() => (
          <>
            {/* Resumen */}
            <View style={s.resumenCard}>
              <Text style={s.resumenTitulo}>{detalle.titulo}</Text>
              <Text style={s.resumenMeta}>Parcial {detalle.parcial} · {detalle.periodo}</Text>

              {/* Barra de progreso */}
              <View style={s.progRow}>
                <Text style={s.progTxt}>{respondidas}/{alumnos.length} respondidas</Text>
                <Text style={s.progPct}>{pct}%</Text>
              </View>
              <View style={s.barraFondo}>
                <View style={[s.barraRelleno, { width: `${pct}%` }]} />
              </View>

              {/* Semáforo resumen */}
              {(semConteo.verde || semConteo.amarillo || semConteo.rojo) ? (
                <View style={s.semRow}>
                  {['verde','amarillo','rojo'].map(k => semConteo[k] ? (
                    <View key={k} style={[s.semChip, { backgroundColor: SEM[k].bg }]}>
                      <Text style={[s.semChipTxt, { color: SEM[k].color }]}>
                        {SEM[k].e} {semConteo[k]} — {SEM[k].label}
                      </Text>
                    </View>
                  ) : null)}
                </View>
              ) : null}

              {/* Acciones */}
              {detalle.estatus === 'publicada' && (
                <TouchableOpacity style={[s.btnCerrar, accionando && { opacity:0.6 }]}
                  onPress={() => accion('cerrar')} disabled={accionando}>
                  {accionando ? <ActivityIndicator color="#fff" size="small" /> :
                    <Text style={s.btnCerrarTxt}>Cerrar tutoría</Text>}
                </TouchableOpacity>
              )}
              {detalle.estatus === 'borrador' && (
                <TouchableOpacity style={[s.btnPublicar, accionando && { opacity:0.6 }]}
                  onPress={() => accion('publicar')} disabled={accionando}>
                  {accionando ? <ActivityIndicator color="#fff" size="small" /> :
                    <Text style={s.btnPublicarTxt}>Publicar tutoría</Text>}
                </TouchableOpacity>
              )}
            </View>

            <Text style={s.seccion}>Alumnos del grupo</Text>
          </>
        )}
        renderItem={({ item }) => {
          const resp   = item.estado === 'respondida';
          const sem    = item.nivel_riesgo ? SEM[item.nivel_riesgo] : null;
          const inicial = (item.nombre || '?').charAt(0).toUpperCase();
          return (
            <View style={[s.alumnoCard, resp && sem && { borderLeftColor: sem.color, borderLeftWidth: 3 }]}>
              <View style={[s.avatar, resp && sem ? { backgroundColor: sem.bg } : { backgroundColor: '#f5f5f5' }]}>
                <Text style={[s.avatarTxt, resp && sem ? { color: sem.color } : { color: '#aaa' }]}>{inicial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alumnoNombre}>{item.nombre} {item.apellido_paterno}</Text>
                <Text style={s.alumnoMat}>Matrícula: {item.matricula || '—'}</Text>
                {resp && sem && (
                  <Text style={[s.semResultTxt, { color: sem.color }]}>
                    {sem.e} {item.puntaje_total}% — {sem.label}
                  </Text>
                )}
              </View>
              <View style={[s.estadoBadge, resp ? s.estadoBadgeResp : s.estadoBadgePend]}>
                <Text style={[s.estadoBadgeTxt, resp ? { color: GREEN } : { color: '#888' }]}>
                  {resp ? '✓ Respondida' : 'Pendiente'}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.vacioBox}>
            <Text style={s.vacioTxt}>Sin alumnos asignados aún</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center' },
  backTxt:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerFolio:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerMat:    { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  estatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estatusTxt:   { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  resumenCard:  { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16,
                  borderWidth: 0.5, borderColor: '#e0e0e0' },
  resumenTitulo:{ fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 4 },
  resumenMeta:  { fontSize: 12, color: '#888', marginBottom: 14 },
  progRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progTxt:      { fontSize: 13, color: '#555' },
  progPct:      { fontSize: 13, fontWeight: '700', color: GREEN },
  barraFondo:   { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 12 },
  barraRelleno: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  semRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  semChip:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  semChipTxt:   { fontSize: 12, fontWeight: '700' },
  btnCerrar:    { backgroundColor: '#C62828', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnCerrarTxt: { color: '#fff', fontWeight: '700' },
  btnPublicar:  { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnPublicarTxt:{ color: '#fff', fontWeight: '700' },
  seccion:      { fontSize: 11, fontWeight: '700', color: '#558B2F', textTransform: 'uppercase',
                  letterSpacing: 0.5, paddingHorizontal: 16, paddingBottom: 8 },
  alumnoCard:   { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12,
                  padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderWidth: 0.5, borderColor: '#e0e0e0' },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 18, fontWeight: '800' },
  alumnoNombre: { fontSize: 14, fontWeight: '700', color: '#333' },
  alumnoMat:    { fontSize: 12, color: '#888', marginTop: 2 },
  semResultTxt: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  estadoBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoBadgeResp:{ backgroundColor: '#E8F5E9' },
  estadoBadgePend:{ backgroundColor: '#f5f5f5' },
  estadoBadgeTxt: { fontSize: 11, fontWeight: '600' },
  vacioBox:     { alignItems: 'center', paddingTop: 40 },
  vacioTxt:     { color: '#aaa', fontSize: 14 },
});
