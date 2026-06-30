import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import Login from './src/screens/login';
import Cadastro from './src/screens/cadastro';
import Home from './src/screens/home';
import Grupo from './src/screens/Grupo';
import Checkin from './src/screens/checkin';
import Perfil from './src/screens/perfil';
import Chat from './src/screens/chat';
import { carregarUsuarioSessao } from './src/services/sessao';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { isDark, palette } = useTheme();
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [usuarioSessao, setUsuarioSessao] = useState(null);

  useEffect(() => {
    const carregarSessao = async () => {
      try {
        const usuario = await carregarUsuarioSessao();
        setUsuarioSessao(usuario);
      } finally {
        setCarregandoSessao(false);
      }
    };

    carregarSessao();
  }, []);

  if (carregandoSessao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Stack.Navigator
          initialRouteName={usuarioSessao ? 'Home' : 'Login'}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="Home" component={Home} initialParams={{ usuario: usuarioSessao }} />
          <Stack.Screen name="Grupo" component={Grupo} />
          <Stack.Screen name="Checkin" component={Checkin} />
          <Stack.Screen name="Perfil" component={Perfil} />
          <Stack.Screen name="Chat" component={Chat} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigation />
    </ThemeProvider>
  );
}
