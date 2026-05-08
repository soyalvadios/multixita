import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';
import React                        from 'react';
import { Platform }                 from 'react-native';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import CoordinadorAccesos        from './CoordinadorAccesos';
import CoordinadorAgregarDocente from './CoordinadorAgregarDocente';
import CoordinadorAlumnoDetalle  from './CoordinadorAlumnoDetalle';
import CoordinadorAlumnos        from './CoordinadorAlumnos';
import CoordinadorDashboard      from './CoordinadorDashboard';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function AlumnosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaAlumnos" component={CoordinadorAlumnos} />
      <Stack.Screen name="AlumnoDetalle" component={CoordinadorAlumnoDetalle} />
    </Stack.Navigator>
  );
}

function GestionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgregarDocente" component={CoordinadorAgregarDocente} />
    </Stack.Navigator>
  );
}

const ICONS = {
  Inicio:   { active: 'home',          inactive: 'home-outline' },
  Alumnos:  { active: 'people',        inactive: 'people-outline' },
  Accesos:  { active: 'swap-vertical', inactive: 'swap-vertical-outline' },
  Gestión:  { active: 'settings',      inactive: 'settings-outline' },
};

export default function CoordinadorTabs() {
  const insets = useSafeAreaInsets();
  const pb     = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 4);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 0.5,
          height: 56 + pb,
          paddingBottom: pb,
          paddingTop: 6,
          elevation: 4,
        },
        tabBarActiveTintColor:   '#2E7D32',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const map = ICONS[route.name];
          return <Ionicons name={focused ? map?.active : map?.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio"  component={CoordinadorDashboard} />
      <Tab.Screen name="Alumnos" component={AlumnosStack} />
      <Tab.Screen name="Accesos" component={CoordinadorAccesos} />
      <Tab.Screen name="Gestión" component={GestionStack} />
    </Tab.Navigator>
  );
}
