import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/login';
import Cadastro from './src/screens/cadastro';
import Home from './src/screens/home';
import Grupo from './src/screens/Grupo';
import Checkin from './src/screens/checkin';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Grupo" component={Grupo} />
        <Stack.Screen name="Checkin" component={Checkin} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
