import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { salvarUsuarioSessao } from '../services/sessao';
import { styles } from './styles';

const lerResposta = async (resposta: Response) => {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

export default function Perfil() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const usuarioInicial = route.params?.usuario ?? {};
  const usuarioId = usuarioInicial?.id != null ? String(usuarioInicial.id) : null;

  const [usuario, setUsuario] = useState<any>(usuarioInicial);
  const [nome, setNome] = useState(String(usuarioInicial?.nome ?? ''));
  const [email, setEmail] = useState(String(usuarioInicial?.email ?? ''));
  const [senha, setSenha] = useState('');
  const [quantidadeGrupos, setQuantidadeGrupos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregarPerfil = useCallback(async () => {
    if (!usuarioId) {
      setCarregando(false);
      setRefreshing(false);
      return;
    }

    try {
      const [resUsuario, resGrupos] = await Promise.all([
        fetch(`${API_URL}/api/usuarios/${usuarioId}`),
        fetch(`${API_URL}/api/grupos?doUsuario=true`, {
          headers: { 'X-Usuario-Id': usuarioId },
        }),
      ]);

      const dadosUsuario = await lerResposta(resUsuario);
      const dadosGrupos = await lerResposta(resGrupos);

      if (resUsuario.ok && dadosUsuario && typeof dadosUsuario === 'object') {
        setUsuario(dadosUsuario);
        setNome(String(dadosUsuario.nome ?? ''));
        setEmail(String(dadosUsuario.email ?? ''));
        await salvarUsuarioSessao(dadosUsuario);
      }

      setQuantidadeGrupos(resGrupos.ok && Array.isArray(dadosGrupos) ? dadosGrupos.length : 0);
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel carregar seu perfil.');
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [usuarioId]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarPerfil();
    }, [carregarPerfil])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    carregarPerfil();
  };

  const handleSalvar = async () => {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (!usuarioId) {
      Alert.alert('Sessao', 'Faca login novamente.');
      return;
    }
    if (!nomeLimpo || !emailLimpo) {
      Alert.alert('Atencao', 'Nome e email sao obrigatorios.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeLimpo,
          email: emailLimpo,
          senha: senha.trim(),
        }),
      });
      const dados = await lerResposta(resposta);

      if (resposta.status === 409) {
        Alert.alert('Email', 'Este email ja esta sendo usado por outro usuario.');
        return;
      }
      if (!resposta.ok) {
        const msg =
          typeof dados === 'object' && dados !== null
            ? dados.mensagem || dados.message || dados.error
            : dados;
        Alert.alert('Erro', String(msg || `Nao foi possivel salvar (${resposta.status}).`));
        return;
      }

      if (dados && typeof dados === 'object') {
        setUsuario(dados);
        setSenha('');
        await salvarUsuarioSessao(dados);
      }
      Alert.alert('Perfil', 'Informacoes atualizadas com sucesso.');
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel salvar seu perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const pontos = Number(usuario?.pontosTotais ?? usuario?.pontos ?? 0);
  const iniciais = nome.trim().length >= 2 ? nome.trim().substring(0, 2).toUpperCase() : 'GM';

  if (carregando) {
    return (
      <View style={[styles.homeContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <View style={styles.homeContainer}>
      <View style={[styles.grupoHeaderTop, { justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.grupoHeaderTitle, { flex: 1 }]}>Perfil</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF8C00']} />}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              backgroundColor: '#FF8C00',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold' }}>{iniciais}</Text>
          </View>
          <Text style={{ color: '#0B2046', fontSize: 22, fontWeight: 'bold' }}>{nome || 'Usuario'}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>{email}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={[styles.rankCard, { flex: 1, marginHorizontal: 0, marginTop: 0, flexDirection: 'column' }]}>
            <Feather name="award" size={22} color="#FF8C00" />
            <Text style={{ color: '#0B2046', fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{pontos}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>pontos</Text>
          </View>
          <View style={[styles.rankCard, { flex: 1, marginHorizontal: 0, marginTop: 0, flexDirection: 'column' }]}>
            <Feather name="users" size={22} color="#FF8C00" />
            <Text style={{ color: '#0B2046', fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{quantidadeGrupos}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>grupos</Text>
          </View>
        </View>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Nova senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={(texto) => setSenha(texto.replace(/\s/g, ''))}
          placeholder="Deixe vazio para manter a atual"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSalvar} disabled={salvando}>
          <Text style={styles.buttonText}>{salvando ? 'Salvando...' : 'Salvar alteracoes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
