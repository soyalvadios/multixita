import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';
import React                        from 'react';
import { Platform }                 from 'react-native';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import DocenteDashboard      from './DocenteDashboard';
import DocenteTutoriasList   from './DocenteTutoriasList';
import DocenteNuevaTutoria   from './DocenteNuevaTutoria';
import DocenteTutoriaDetalle from './DocenteTutoriaDetalle';
import DocenteSubirActa      from './DocenteSubirActa';
import { colors }            from './SharedStyles';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TutoriasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaTutorias"  component={DocenteTutoriasList} />
      <Stack.Screen name="NuevaTutoria"   component={DocenteNuevaTutoria} />
      <Stack.Screen name="DetalleTutoria" component={DocenteTutoriaDetalle} />
    </Stack.Navigator>
  );
}

// Stack para calificaciones — permite navegar a SubirActa desde el tab
function CalificacionesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SubirActa" component={DocenteSubirActa} />
    </Stack.Navigator>
  );
}

const ICONS = {
  Inicio:          { active: 'home',             inactive: 'home-outline' },
  Tutorías:        { active: 'people',           inactive: 'people-outline' },
  Calificaciones:  { active: 'document-text',    inactive: 'document-text-outline' },
};

export default function DocenteTabs() {
  const insets = useSafeAreaInsets();
  const pb     = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 4);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgWhite ?? '#fff',
          borderTopColor:  colors.border  ?? '#eee',
          borderTopWidth: 0.5,
          height: 56 + pb, paddingBottom: pb, paddingTop: 6, elevation: 4,
        },
        tabBarActiveTintColor:   colors.primary ?? '#2E7D32',
        tabBarInactiveTintColor: colors.faint   ?? '#888',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const map = ICONS[route.name];
          return <Ionicons name={focused ? map?.active : map?.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio"         component={DocenteDashboard} />
      <Tab.Screen name="Tutorías"       component={TutoriasStack} />
      <Tab.Screen name="Calificaciones" component={CalificacionesStack} />
    </Tab.Navigator>
  );
}
