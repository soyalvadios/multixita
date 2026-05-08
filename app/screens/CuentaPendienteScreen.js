import { CommonActions } from '@react-navigation/native';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const GREEN = '#2E7D32';

export default function CuentaPendienteScreen({ navigation }) {
  const { usuario, logout, cerrarSesion } = useAuth();

  // Compatibilidad: usar logout o cerrarSesion según cómo esté nombrado en AuthContext
  const fnLogout = logout || cerrarSesion;

  const rechazada = usuario?.estado_verificacion_facial === 'rechazada';
  const motivo    = usuario?.motivo_rechazo || null;

  const handleCerrarSesion = async () => {
    try {
      // 1. Llamar logout del contexto — limpia token, usuario y SecureStore
      if (typeof fnLogout === 'function') {
        await fnLogout();
      }
    } catch (_) {
      // Si falla el logout del contexto, igual navegamos fuera
    }
    // 2. Reset completo de navegación a Login — no queda back disponible
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  // Si no hay usuario (vino del flujo de registro sin sesión real),
  // el botón de cerrar sesión igual resetea a Login correctamente.

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        {rechazada ? (
          <>
            <View style={s.iconBox}><Text style={s.icon}>❌</Text></View>
            <Text style={[s.titulo, { color: '#C62828' }]}>Cuenta rechazada</Text>
            <Text style={s.sub}>Tu solicitud fue rechazada por el administrador.</Text>
            {motivo ? (
              <View style={[s.infoBox, { borderColor: '#ffcdd2', backgroundColor: '#fff9f9' }]}>
                <Text style={[s.infoTitulo, { color: '#C62828' }]}>Motivo</Text>
                <Text style={s.infoTxt}>{motivo}</Text>
              </View>
            ) : null}
            <View style={[s.infoBox, { borderColor: '#ffcdd2', backgroundColor: '#fff9f9' }]}>
              <Text style={[s.infoTitulo, { color: '#C62828' }]}>¿Qué debes hacer?</Text>
              <Text style={s.infoTxt}>• Acércate con la coordinación escolar de UES Temascalcingo.</Text>
              <Text style={s.infoTxt}>• Presenta tu credencial UMB original.</Text>
            </View>
          </>
        ) : (
          <>
            <View style={s.iconBox}><Text style={s.icon}>⏳</Text></View>
            <Text style={[s.titulo, { color: GREEN }]}>Cuenta en revisión</Text>
            <Text style={s.sub}>Tu solicitud fue recibida y está siendo revisada.</Text>
            <View style={s.infoBox}>
              <Text style={s.infoTitulo}>¿Qué sigue?</Text>
              <Text style={s.infoTxt}>• Tu credencial UMB está siendo verificada.</Text>
              <Text style={s.infoTxt}>• Un administrador aprobará tu cuenta.</Text>
              <Text style={s.infoTxt}>• Puedes cerrar sesión y volver más tarde.</Text>
            </View>
          </>
        )}

        {/* Botón cerrar sesión — llama logout() + reset navegación */}
        <TouchableOpacity style={s.cerrarBtn} onPress={handleCerrarSesion}>
          <Text style={s.cerrarTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f5f5f5' },
  scroll:     { padding: 24, alignItems: 'center', paddingTop: 48 },
  iconBox:    { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F1F8E9',
                alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                borderWidth: 1, borderColor: '#C8E6C9' },
  icon:       { fontSize: 40 },
  titulo:     { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub:        { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  infoBox:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, width: '100%',
                borderWidth: 0.5, borderColor: '#C8E6C9', marginBottom: 12 },
  infoTitulo: { fontSize: 12, fontWeight: '700', color: GREEN, textTransform: 'uppercase',
                letterSpacing: 0.5, marginBottom: 10 },
  infoTxt:    { fontSize: 13, color: '#555', lineHeight: 22, marginBottom: 2 },
  cerrarBtn:  { borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 28, paddingVertical: 13,
                paddingHorizontal: 32, backgroundColor: '#fff9f9', marginTop: 12 },
  cerrarTxt:  { color: '#C62828', fontSize: 14, fontWeight: '500' },
});
