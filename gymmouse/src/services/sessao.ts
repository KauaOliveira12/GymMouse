import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSAO_USUARIO_KEY = '@gymmouse:usuario';

export const salvarUsuarioSessao = async (usuario: unknown) => {
  await AsyncStorage.setItem(SESSAO_USUARIO_KEY, JSON.stringify(usuario));
};

export const carregarUsuarioSessao = async () => {
  const usuarioSalvo = await AsyncStorage.getItem(SESSAO_USUARIO_KEY);
  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo);
  } catch {
    await AsyncStorage.removeItem(SESSAO_USUARIO_KEY);
    return null;
  }
};

export const limparUsuarioSessao = async () => {
  await AsyncStorage.removeItem(SESSAO_USUARIO_KEY);
};
