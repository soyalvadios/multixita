import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';

const GREEN = '#2E7D32';
const DARK  = '#1B5E20';

async function subirActaPDF(token, fileUri, fileName) {
  const form = new FormData();
  form.append('acta', {
    uri:  fileUri,
    name: fileName || 'acta.pdf',
    type: 'application/pdf',
  });
  const res = await fetch(
    `${BASE_URL.replace(/\/$/, '')}/api/tutorias/docente/subir-acta`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function DocenteSubirActa({ navigation }) {
  const { token, handleTokenExpired } = useAuth();
  const [archivo,   setArchivo]   = useState(null);
  const [subiendo,  setSubiendo]  = useState(false);
  const [resultado, setResultado] = useState(null);

  const seleccionarPDF = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type:       'application/pdf',
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets?.[0] || res;
      setArchivo(file);
      setResultado(null);
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const procesar = async () => {
    if (!archivo) {
      Alert.alert('Sin archivo', 'Primero selecciona el PDF del acta.'); return;
    }
    setSubiendo(true);
    setResultado(null);
    try {
      const data = await subirActaPDF(token, archivo.uri, archivo.name);
      setResultado(data);
    } catch (e) {
      if (e.message === 'Sesión expirada') { handleTokenExpired?.(); return; }
      Alert.alert('Error al procesar', e.message);
    } finally {
      setSubiendo(false);
    }
  };

  const limpiar = () => { setArchivo(null); setResultado(null); };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Subir acta PDF</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Info */}
        <View style={s.infoBox}>
          <Text style={s.infoTitulo}>📋 ¿Qué hace esto?</Text>
          <Text style={s.infoTxt}>
            Selecciona el PDF del "Acta Interna Parcial" descargado de SIDIUMB.
            El sistema extraerá materia, grupo, parcial y calificaciones automáticamente.
          </Text>
        </View>

        {/* Selector de archivo */}
        <TouchableOpacity style={s.selectorBtn} onPress={seleccionarPDF} activeOpacity={0.8}>
          <Text style={s.selectorIcon}>📄</Text>
          {archivo ? (
            <View style={s.selectorInfo}>
              <Text style={s.selectorNombre} numberOfLines={2}>{archivo.name}</Text>
              <Text style={s.selectorTam}>
                {archivo.size ? `${(archivo.size / 1024).toFixed(0)} KB` : 'PDF seleccionado'}
              </Text>
            </View>
          ) : (
            <Text style={s.selectorPlaceholder}>Toca para seleccionar el PDF</Text>
          )}
        </TouchableOpacity>

        {/* Botones de acción */}
        {archivo && !resultado && (
          <View style={s.accionRow}>
            <TouchableOpacity style={s.btnSecundario} onPress={limpiar}>
              <Text style={s.btnSecundarioTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, subiendo && { opacity: 0.65 }]}
              onPress={procesar}
              disabled={subiendo}
            >
              {subiendo
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnTxt}>Procesar acta</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado */}
        {resultado && (
          <>
            {/* Resumen */}
            <View style={s.resumenCard}>
              <Text style={s.resumenTitulo}>✅ Acta procesada</Text>
              <View style={s.resumenFila}>
                <Text style={s.resumenLabel}>Materia</Text>
                <Text style={s.resumenVal}>{resultado.resumen?.materia ?? '—'}</Text>
              </View>
              <View style={s.resumenFila}>
                <Text style={s.resumenLabel}>Grupo</Text>
                <Text style={s.resumenVal}>{resultado.resumen?.grupo ?? '—'}</Text>
              </View>
              <View style={s.resumenFila}>
                <Text style={s.resumenLabel}>Parcial</Text>
                <Text style={s.resumenVal}>{resultado.resumen?.parcial ?? '—'}</Text>
              </View>
              <View style={s.resumenFila}>
                <Text style={s.resumenLabel}>Fecha captura</Text>
                <Text style={s.resumenVal}>{resultado.resumen?.fecha ?? '—'}</Text>
              </View>
              <View style={[s.resumenFila, { marginTop: 8 }]}>
                <View style={s.badgeVerde}>
                  <Text style={s.badgeVerdeT}>✓ {resultado.resumen?.actualizados ?? 0} actualizados</Text>
                </View>
                {(resultado.resumen?.errores ?? 0) > 0 && (
                  <View style={s.badgeRojo}>
                    <Text style={s.badgeRojoT}>✗ {resultado.resumen.errores} errores</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Detalle de actualizados */}
            {resultado.actualizados?.length > 0 && (
              <View style={s.detalleCard}>
                <Text style={s.detalleTitulo}>Calificaciones registradas</Text>
                {resultado.actualizados.map((a, i) => (
                  <View key={i} style={s.detalleItem}>
                    <Text style={s.detalleMatricula}>{a.matricula}</Text>
                    <Text style={s.detalleAsist}>{a.asistencias}</Text>
                    <View style={s.calBadge}>
                      <Text style={s.calBadgeTxt}>{a.calificacion}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Errores */}
            {resultado.errores?.length > 0 && (
              <View style={s.erroresCard}>
                <Text style={s.erroresTitulo}>⚠️ Matrículas no procesadas</Text>
                {resultado.errores.map((e, i) => (
                  <View key={i} style={s.errorItem}>
                    <Text style={s.errorMatricula}>{e.matricula}</Text>
                    <Text style={s.errorMotivo}>{e.motivo}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Nueva acta */}
            <TouchableOpacity style={s.btnSecundario} onPress={limpiar}>
              <Text style={s.btnSecundarioTxt}>📄 Subir otro acta</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { backgroundColor: GREEN, paddingTop: 52, paddingBottom: 14,
                      paddingHorizontal: 16, flexDirection: 'row',
                      justifyContent: 'space-between', alignItems: 'center' },
  backBtn:          { width: 64 },
  backTxt:          { color: '#C8E6C9', fontSize: 15, fontWeight: '600' },
  headerTitulo:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  scroll:           { padding: 16, paddingBottom: 40 },
  infoBox:          { backgroundColor: '#F1F8E9', borderRadius: 12, padding: 14,
                      borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 16 },
  infoTitulo:       { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 6 },
  infoTxt:          { fontSize: 13, color: '#558B2F', lineHeight: 20 },
  selectorBtn:      { backgroundColor: '#fff', borderRadius: 14, padding: 18,
                      borderWidth: 1.5, borderColor: '#C8E6C9', borderStyle: 'dashed',
                      flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  selectorIcon:     { fontSize: 36 },
  selectorPlaceholder:{ fontSize: 14, color: '#aaa', flex: 1 },
  selectorInfo:     { flex: 1 },
  selectorNombre:   { fontSize: 14, fontWeight: '600', color: DARK },
  selectorTam:      { fontSize: 12, color: '#888', marginTop: 2 },
  accionRow:        { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btn:              { flex: 1, backgroundColor: GREEN, borderRadius: 28,
                      paddingVertical: 14, alignItems: 'center' },
  btnTxt:           { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecundario:    { flex: 1, borderWidth: 1.5, borderColor: GREEN, borderRadius: 28,
                      paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff',
                      marginBottom: 12 },
  btnSecundarioTxt: { color: GREEN, fontWeight: '700', fontSize: 14 },
  // Resumen
  resumenCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                      borderWidth: 0.5, borderColor: '#C8E6C9', marginBottom: 12 },
  resumenTitulo:    { fontSize: 15, fontWeight: '800', color: DARK, marginBottom: 12 },
  resumenFila:      { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 },
  resumenLabel:     { fontSize: 12, color: '#888', fontWeight: '600' },
  resumenVal:       { fontSize: 13, color: DARK, fontWeight: '700' },
  badgeVerde:       { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 12,
                      paddingVertical: 5, borderWidth: 0.5, borderColor: '#A5D6A7' },
  badgeVerdeT:      { color: DARK, fontWeight: '700', fontSize: 12 },
  badgeRojo:        { backgroundColor: '#FFEBEE', borderRadius: 20, paddingHorizontal: 12,
                      paddingVertical: 5, borderWidth: 0.5, borderColor: '#FFCDD2' },
  badgeRojoT:       { color: '#C62828', fontWeight: '700', fontSize: 12 },
  // Detalle calificaciones
  detalleCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                      borderWidth: 0.5, borderColor: '#e0e0e0', marginBottom: 12 },
  detalleTitulo:    { fontSize: 13, fontWeight: '700', color: DARK,
                      marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  detalleItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 7,
                      borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', gap: 8 },
  detalleMatricula: { fontSize: 13, fontWeight: '700', color: '#333', flex: 1 },
  detalleAsist:     { fontSize: 12, color: '#888', width: 50, textAlign: 'center' },
  calBadge:         { backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 12,
                      paddingVertical: 4 },
  calBadgeTxt:      { color: '#fff', fontWeight: '800', fontSize: 13 },
  // Errores
  erroresCard:      { backgroundColor: '#FFF8E1', borderRadius: 14, padding: 16,
                      borderWidth: 0.5, borderColor: '#FFE082', marginBottom: 12 },
  erroresTitulo:    { fontSize: 13, fontWeight: '700', color: '#E65100', marginBottom: 10 },
  errorItem:        { paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#FFE082' },
  errorMatricula:   { fontSize: 13, fontWeight: '700', color: '#333' },
  errorMotivo:      { fontSize: 12, color: '#888', marginTop: 2 },
});
