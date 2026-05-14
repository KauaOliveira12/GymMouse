import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/login';
import Cadastro from './src/screens/cadastro';
import Home from './src/screens/home';
import Grupo from './src/screens/Grupo';
import Checkin from './src/screens/checkin';
import Perfil from './src/screens/perfil';
import { carregarUsuarioSessao } from './src/services/sessao';

const Stack = createNativeStackNavigator();

export default function App() {
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
