import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { limparUsuarioSessao } from '../services/sessao';
import { styles } from './styles';

const GRUPOS_URL = `${API_URL}/api/grupos`;
const GRUPOS_ENTRAR_URL = `${API_URL}/api/grupos/entrar`;

interface Grupo {
  id: string;
  nome: string;
  membros: number;
  rank: number;
  pontos: number;
  descricao?: string;
  imagem?: string;
}

const formatarGrupoEntrada = (entrada: any): Grupo | null => {
  const id = entrada?.grupo?.id ?? entrada?.grupoId ?? entrada?.id;
  const nome = entrada?.grupo?.nome ?? entrada?.nomeGrupo ?? entrada?.nome;
  if (id == null) return null;

  return {
    id: String(id),
    nome: nome != null ? String(nome) : 'Grupo',
    descricao: entrada?.grupo?.descricao ?? entrada?.descricao ?? '',
    membros: typeof entrada?.grupo?.membros === 'number' ? entrada.grupo.membros : 1,
    rank: 0,
    pontos: 0,
    imagem: entrada?.grupo?.imagem ?? entrada?.grupo?.imagemUrl,
  };
};

const formatarGrupo = (grupo: any): Grupo => ({
  id: String(grupo.id),
  nome: grupo.nome ?? '',
  descricao: grupo.descricao ?? '',
  membros:
    typeof grupo.totalMembros === 'number'
      ? grupo.totalMembros
      : typeof grupo.membros === 'number'
      ? grupo.membros
      : 1,
  rank: typeof grupo.rank === 'number' ? grupo.rank : 0,
  pontos: typeof grupo.pontos === 'number' ? grupo.pontos : 0,
  imagem: grupo.imagem ?? grupo.imagemUrl,
});

const lerResposta = async (resposta: Response) => {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

const fetchComTimeout = async (url: string, options?: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

export default function Home() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const usuario = route.params?.usuario as { id?: number | string } | undefined;

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [telaModal, setTelaModal] = useState<'opcoes' | 'criar' | 'entrar'>('opcoes');
  const [nomeNovoGrupo, setNomeNovoGrupo] = useState('');
  const [descricaoNovoGrupo, setDescricaoNovoGrupo] = useState('');
  const [codigoEntrada, setCodigoEntrada] = useState('');

  const usuarioId = usuario?.id != null && String(usuario.id).trim() !== '' ? String(usuario.id) : null;

  const carregarGrupos = useCallback(async () => {
    if (!usuarioId) {
      setGrupos([]);
      setCarregando(false);
      setRefreshing(false);
      return;
    }

    try {
      const url = `${GRUPOS_URL}?doUsuario=true`;
      const resposta = await fetchComTimeout(url, {
        headers: { 'X-Usuario-Id': usuarioId },
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        const msg =
          typeof dados === 'object' && dados !== null
            ? dados.mensagem || dados.message || dados.error
            : dados;
        Alert.alert('Erro', String(msg || `Nao foi possivel carregar grupos (${resposta.status}).`));
        setGrupos([]);
        return;
      }

      const lista = Array.isArray(dados) ? dados : [];
      setGrupos(lista.map(formatarGrupo));
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel conectar a API. Confira o IP em src/config/api.ts e se o servidor esta no ar.');
      setGrupos([]);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [usuarioId]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarGrupos();
    }, [carregarGrupos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarGrupos();
  };

  const handleCriarGrupo = async () => {
    if (nomeNovoGrupo.trim() === '') {
      Alert.alert('Atencao', 'O nome do grupo e obrigatorio.');
      return;
    }
    if (!usuarioId) {
      Alert.alert('Sessao', 'Faca login novamente.');
      return;
    }

    setSalvando(true);
    try {
      const nome = nomeNovoGrupo.trim();
      const descricao = descricaoNovoGrupo.trim();
      const resposta = await fetchComTimeout(GRUPOS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': usuarioId,
        },
        body: JSON.stringify({ nome, descricao }),
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        const msg =
          typeof dados === 'object' && dados !== null
            ? dados.mensagem || dados.message || dados.error
            : dados;
        Alert.alert('Erro', String(msg || `Nao foi possivel criar o grupo (${resposta.status}).`));
        return;
      }

      const g = dados && typeof dados === 'object' ? formatarGrupo(dados) : null;
      fecharModal();
      await carregarGrupos();

      if (g) {
        setTimeout(() => {
          navigation.navigate('Grupo', {
            id: g.id,
            nome: g.nome,
            membros: g.membros,
            pontos: g.pontos,
            descricao: g.descricao,
            usuarioId: usuarioId,
            usuario,
          });
        }, 150);
      } else {
        Alert.alert('Sucesso', 'Grupo criado.');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao criar grupo. Verifique a API.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEntrarGrupo = async () => {
    const codigo = codigoEntrada.trim();
    if (!codigo) {
      Alert.alert('Atencao', 'Informe o codigo de acesso.');
      return;
    }
    if (!usuarioId) {
      Alert.alert('Sessao', 'Faca login novamente.');
      return;
    }

    setEntrando(true);
    try {
      const resposta = await fetchComTimeout(GRUPOS_ENTRAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          codigoAcesso: codigo,
        }),
      });
      const dados = await lerResposta(resposta);

      if (resposta.status === 409) {
        Alert.alert('Atencao', 'Voce ja participa deste grupo.');
        return;
      }
      if (!resposta.ok) {
        const msg =
          typeof dados === 'object' && dados !== null
            ? dados.mensagem || dados.message || dados.error
            : dados;
        Alert.alert('Erro', String(msg || `Codigo invalido ou erro (${resposta.status}).`));
        return;
      }

      const grupoPayload = dados && typeof dados === 'object' ? formatarGrupoEntrada(dados) : null;
      fecharModal();
      await carregarGrupos();

      if (grupoPayload) {
        const g = grupoPayload;
        setTimeout(() => {
          navigation.navigate('Grupo', {
            id: g.id,
            nome: g.nome,
            membros: g.membros,
            pontos: g.pontos,
            descricao: g.descricao,
            usuarioId: usuarioId,
            usuario,
          });
        }, 150);
      } else {
        Alert.alert('Sucesso', 'Voce entrou no grupo.');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao entrar no grupo.');
    } finally {
      setEntrando(false);
    }
  };

  const handleLogout = async () => {
    await limparUsuarioSessao();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderCard = ({ item }: { item: Grupo }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() =>
        navigation.navigate('Grupo', {
          id: item.id,
          nome: item.nome,
          membros: item.membros,
          pontos: item.pontos,
          descricao: item.descricao,
          usuarioId: usuarioId,
          usuario,
        })
      }
    >
      {item.imagem ? (
        <Image source={{ uri: item.imagem }} style={styles.groupCardImage} />
      ) : (
        <View style={[styles.groupCardImage, { backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontWeight: 'bold', color: '#666' }}>
            {item.nome.length >= 2 ? item.nome.substring(0, 2).toUpperCase() : '?'}
          </Text>
        </View>
      )}

      <View style={styles.groupCardInfo}>
        <Text style={styles.groupCardTitle}>{item.nome}</Text>
        <View style={styles.groupCardRow}>
          <Feather name="users" size={14} color="#666" />
          <Text style={styles.groupCardText}>{item.membros} membros</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const fecharModal = () => {
    setModalVisivel(false);
    setTelaModal('opcoes');
    setNomeNovoGrupo('');
    setDescricaoNovoGrupo('');
    setCodigoEntrada('');
  };

  if (!usuarioId) {
    return (
      <View style={[styles.homeContainer, { justifyContent: 'center', padding: 24 }]}>
        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
          Nenhum usuario na sessao. Entre com login na API para ver seus grupos.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
          <Text style={styles.buttonText}>Ir para login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.homeContainer}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoCircle}>
            <Text>🐭</Text>
          </View>
          <Text style={styles.headerTitle}>GymMouse</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.btnSair}
            onPress={() => navigation.navigate('Perfil', { usuario })}
            accessibilityLabel="Perfil"
          >
            <Feather name="user" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSair} onPress={handleLogout} accessibilityLabel="Deslogar">
            <Feather name="log-out" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.pageTitle}>Meus Grupos</Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#FF8C00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8C00']} />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 48, color: '#999', paddingHorizontal: 24 }}>
              Nenhum grupo ainda. Crie um ou entre com um codigo de acesso.
            </Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {telaModal === 'opcoes' ? 'Acoes' : telaModal === 'criar' ? 'Novo Grupo' : 'Entrar no grupo'}
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {telaModal === 'opcoes' && (
              <View>
                <TouchableOpacity style={styles.modalActionBtn} onPress={() => setTelaModal('criar')}>
                  <Feather name="users" size={20} color="#333" />
                  <Text style={styles.modalActionText}>Criar Novo Grupo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionBtn} onPress={() => setTelaModal('entrar')}>
                  <Feather name="log-in" size={20} color="#333" />
                  <Text style={styles.modalActionText}>Participar com codigo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    fecharModal();
                    setTimeout(() => Alert.alert('Check-in', 'Abra um grupo e toque na camera para fazer check-in.'), 150);
                  }}
                >
                  <Feather name="camera" size={20} color="#333" />
                  <Text style={styles.modalActionText}>Fazer Check-in</Text>
                </TouchableOpacity>
              </View>
            )}

            {telaModal === 'criar' && (
              <View>
                <Text style={styles.label}>Nome do Grupo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Guerreiros da Academia"
                  value={nomeNovoGrupo}
                  onChangeText={setNomeNovoGrupo}
                />
                <Text style={styles.label}>Descricao (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                  placeholder="Descricao do grupo"
                  value={descricaoNovoGrupo}
                  onChangeText={setDescricaoNovoGrupo}
                  multiline
                />
                <TouchableOpacity style={styles.button} onPress={handleCriarGrupo} disabled={salvando}>
                  <Text style={styles.buttonText}>{salvando ? 'Salvando...' : 'Criar Grupo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setTelaModal('opcoes')}>
                  <Text style={styles.linkText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            )}

            {telaModal === 'entrar' && (
              <View>
                <Text style={styles.label}>Codigo de acesso</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cole o codigo do grupo"
                  value={codigoEntrada}
                  onChangeText={setCodigoEntrada}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.button} onPress={handleEntrarGrupo} disabled={entrando}>
                  <Text style={styles.buttonText}>{entrando ? 'Entrando...' : 'Entrar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setTelaModal('opcoes')}>
                  <Text style={styles.linkText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
