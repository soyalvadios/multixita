import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent }  from 'expo';
import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './context/AuthContext';
import AlumnoTabs             from './screens/AlumnoTabs';
import CoordinadorTabs        from './screens/CoordinadorTabs';
import CuentaPendienteScreen  from './screens/CuentaPendienteScreen';
import DocenteTabs            from './screens/DocenteTabs';
import HistorialAccesosScreen from './screens/HistorialAccesosScreen';
import LoginScreen            from './screens/LoginScreen';
import OficialScreen          from './screens/OficialScreen';
import RegistroScreen         from './screens/RegistroScreen';
import SelfieScreen           from './screens/SelfieScreen';
import SubirCredencialScreen  from './screens/SubirCredencialScreen';

const Stack = createStackNavigator();

function Splash() {
  return (
    <View style={s.splash}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

// ── Stack sin sesión ────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <Stack.Screen name="Login"           component={LoginScreen} />
      <Stack.Screen name="Registro"        component={RegistroScreen} />
      <Stack.Screen name="SubirCredencial" component={SubirCredencialScreen} />
      <Stack.Screen name="Selfie"          component={SelfieScreen} />
      <Stack.Screen name="CuentaPendiente" component={CuentaPendienteScreen} />
    </Stack.Navigator>
  );
}

// ── Stack alumno pendiente de verificación ──────────────────────────────────
function PendienteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="CuentaPendiente">
      <Stack.Screen name="CuentaPendiente" component={CuentaPendienteScreen} />
    </Stack.Navigator>
  );
}

// ── Stack oficial ───────────────────────────────────────────────────────────
function OficialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Oficial">
      <Stack.Screen name="Oficial"          component={OficialScreen} />
      <Stack.Screen name="HistorialAccesos" component={HistorialAccesosScreen} />
    </Stack.Navigator>
  );
}

// ── Lógica de navegación según auth ────────────────────────────────────────
function Navegacion() {
  const { usuario, token, cargando, logoutVersion } = useAuth();

  if (cargando) return <Splash />;

  // Debug temporal — confirma qué usuario llega
  if (token && usuario) {
    console.log('[Auth] usuario.rol =', usuario?.rol, '| activo =', usuario?.activo, '| verificado =', usuario?.identidad_verificada);
  }

  const rol     = usuario?.rol;
  const esAdmin = ['coordinador', 'administrativo', 'administrador'].includes(rol);

// Sin sesión
  // Sin sesión
  if (!token || !usuario) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <AuthStack key={`auth-${logoutVersion}`} />
    </>
  );
  }

  // Alumno pendiente / rechazado
  if (rol === 'alumno' && (!usuario?.activo || !usuario?.identidad_verificada)) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <PendienteStack key="pendiente" />
      </>
    );
  }

  // Alumno activo y verificado
  if (rol === 'alumno') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <AlumnoTabs key="alumno" />
      </>
    );
  }

  // Docente
  if (rol === 'docente') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <DocenteTabs key="docente" />
      </>
    );
  }

  // Admin / coordinador / administrativo
  if (esAdmin) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <CoordinadorTabs key="admin" />
      </>
    );
  }

  // Oficial
  if (rol === 'oficial') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <OficialStack key="oficial" />
      </>
    );
  }

  // Fallback — rol desconocido, volver a login
  console.warn('[Auth] Rol no reconocido:', rol, '— volviendo a login');
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <AuthStack key="auth-fallback" />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navegacion />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2E7D32' },
});

registerRootComponent(App);
export default App;
