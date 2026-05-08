import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';
import React                        from 'react';
import { Platform, View }           from 'react-native';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import AlumnoCuestionario    from './AlumnoCuestionario';
import AlumnoConstancia      from './AlumnoConstancia';
import AlumnoTutoriasScreen  from './AlumnoTutoriasScreen';
import BoletaScreen          from './BoletaScreen';
import BotFlotante           from './BotFlotante';
import CredencialScreen      from './CredencialScreen';
import InicioScreen          from './InicioScreen';
import PerfilScreen          from './PerfilScreen';
import { colors }            from './SharedStyles';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TutoriasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MisTutorias"  component={AlumnoTutoriasScreen} />
      <Stack.Screen name="Cuestionario" component={AlumnoCuestionario} />
      <Stack.Screen name="Constancia"   component={AlumnoConstancia} />
    </Stack.Navigator>
  );
}

const ICONS = {
  Inicio:     { active: 'home',          inactive: 'home-outline' },
  Boleta:     { active: 'document-text', inactive: 'document-text-outline' },
  Credencial: { active: 'card',          inactive: 'card-outline' },
  Tutorías:   { active: 'people',        inactive: 'people-outline' },
  Perfil:     { active: 'person',        inactive: 'person-outline' },
};

export default function AlumnoTabs() {
  const insets = useSafeAreaInsets();
  const pb     = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 4);
  const tabH   = 56 + pb;

  return (
    // View relativo necesario para que el BotFlotante (position:absolute) sea relativo al contenedor
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bgWhite ?? '#fff',
            borderTopColor:  colors.border  ?? '#eee',
            borderTopWidth:  0.5,
            height:          tabH,
            paddingBottom:   pb,
            paddingTop:      6,
            elevation:       4,
          },
          tabBarActiveTintColor:   colors.primary ?? '#2E7D32',
          tabBarInactiveTintColor: colors.faint   ?? '#888',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ focused, color }) => {
            const map = ICONS[route.name];
            return <Ionicons name={focused ? map?.active : map?.inactive} size={21} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio"     component={InicioScreen} />
        <Tab.Screen name="Boleta"     component={BoletaScreen} />
        <Tab.Screen name="Credencial" component={CredencialScreen} />
        <Tab.Screen name="Tutorías"   component={TutoriasStack} />
        <Tab.Screen name="Perfil"     component={PerfilScreen} />
      </Tab.Navigator>

      {/* Bot flotante — visible en todas las tabs del alumno */}
      <BotFlotante />
    </View>
  );
}
