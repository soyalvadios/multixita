import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/api';

let logoSource = null;
try { logoSource = require('../assets/logo.png'); } catch { logoSource = null; }

const GREEN = '#2E7D32';

export default function LoginScreen({ navigation }) {
  const { login }                         = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword]           = useState('');
  const [cargando, setCargando]           = useState(false);

  const handleLogin = async () => {
    const id = identificador.trim();
    if (!id || !password)
      return Alert.alert('Datos incompletos', 'Ingresa tu matrícula o clave y contraseña.');
    setCargando(true);
    try {
      const { token, usuario } = await loginApi(id, password);
      await login(token, usuario);
    } catch (e) {
      Alert.alert('Error al iniciar sesión', e.message || 'Verifica tus credenciales.');
    } finally { setCargando(false); }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false} bounces={false}>
          <View style={s.header}>
            <View style={s.logoCirculo}>
              {logoSource
                ? <Image source={logoSource} style={s.logoImg} resizeMode="contain" />
                : <Text style={s.logoFallback}>MX</Text>}
            </View>
            <Text style={s.titulo}>MultiXita</Text>
            <Text style={s.subtitulo}>UMB TEMASCALCINGO</Text>
          </View>
          <View style={s.form}>
            <Text style={s.label}>Matrícula o clave de administrador</Text>
            <TextInput style={s.input} value={identificador} onChangeText={setIdentificador}
              autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
            <Text style={s.label}>Contraseña</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              secureTextEntry returnKeyType="done" onSubmitEditing={handleLogin} />
            <TouchableOpacity style={[s.btn, cargando && s.btnDisabled]}
              onPress={handleLogin} disabled={cargando} activeOpacity={0.85}>
              {cargando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.registroRow}
              onPress={() => navigation?.navigate?.('Registro')} activeOpacity={0.7}>
              <Text style={s.registroTxtNegro}>¿Eres alumno nuevo? </Text>
              <Text style={s.registroTxtVerde}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Text style={s.footerTxt}>Universidad Mexiquense del Bicentenario</Text>
            <Text style={s.footerTxt}>UES Temascalcingo · Estado de México</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, backgroundColor: '#fff' },
  header: { backgroundColor: GREEN, alignItems: 'center', paddingTop: 48, paddingBottom: 36 },
  logoCirculo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  logoImg: { width: 120, height: 120 },
  logoFallback: { fontSize: 36, fontWeight: '800', color: GREEN },
  titulo: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitulo: { color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' },
  form: { paddingHorizontal: 28, paddingTop: 40 },
  label: { fontSize: 14, color: '#333', marginBottom: 8 },
  input: { height: 56, borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 15, color: '#111', backgroundColor: '#fff', marginBottom: 22 },
  btn: { backgroundColor: GREEN, borderRadius: 28, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  btnDisabled: { backgroundColor: '#81C784' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  registroRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  registroTxtNegro: { fontSize: 14, color: '#444' },
  registroTxtVerde: { fontSize: 14, color: GREEN, fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerTxt: { fontSize: 12, color: '#bbb', lineHeight: 20, textAlign: 'center' },
});
