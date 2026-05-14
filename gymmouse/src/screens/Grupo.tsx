import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { styles } from './styles';
import { POSTS_GLOBAIS } from './checkin';

const lerResposta = async (resposta: Response) => {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

function mapRankingLinha(raw: any, index: number, usuarioLogadoId: string | null) {
  const uid = raw.usuarioId ?? raw.idUsuario ?? raw.id;
  const nome =
    raw.nomeUsuario ?? raw.nome ?? raw.usuarioNome ?? raw.usuario?.nome ?? 'Participante';
  const pos = raw.posicao ?? raw.pos ?? raw.rank ?? raw.colocacao ?? index + 1;
  const pontos = Number(raw.pontos ?? raw.pontuacao ?? raw.score ?? 0);
  const destaque =
    usuarioLogadoId != null && uid != null && String(uid) === String(usuarioLogadoId);

  return {
    id: String(uid ?? `idx-${index}`),
    pos: String(pos),
    nome: String(nome),
    pontos,
    destaque,
  };
}

function idCriadorDoGrupo(grupo: any): string | null {
  if (!grupo || typeof grupo !== 'object') return null;
  const c =
    grupo.criadorId ??
    grupo.criador?.id ??
    grupo.idCriador ??
    grupo.usuarioCriadorId ??
    grupo.criadorUsuarioId;
  if (c == null) return null;
  return String(c);
}

export default function Grupo() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params ?? {};

  const grupoId = params.id != null ? String(params.id) : 'geral';
  const usuarioLogadoId = (() => {
    const u = params.usuarioId ?? params.usuario?.id ?? params.usuario?.usuarioId;
    if (u == null || String(u).trim() === '') return null;
    return String(u);
  })();

  const sairRef = useRef({ grupoId: '', usuarioId: null as string | null });
  useEffect(() => {
    sairRef.current = { grupoId, usuarioId: usuarioLogadoId };
  }, [grupoId, usuarioLogadoId]);

  const [abaAtiva, setAbaAtiva] = useState('checkins');
  const [carregandoApi, setCarregandoApi] = useState(true);
  const [grupoApi, setGrupoApi] = useState<any>(null);
  const [rankingApi, setRankingApi] = useState<any[]>([]);
  const [checkinsLocais, setCheckinsLocais] = useState<any[]>([]);
  const [saindo, setSaindo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [menuVisivel, setMenuVisivel] = useState(false);
  const [confirmarSairVisivel, setConfirmarSairVisivel] = useState(false);
  const [editarVisivel, setEditarVisivel] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [descricaoEdicao, setDescricaoEdicao] = useState('');

  const grupoIdNumerico = grupoId !== 'geral' && !Number.isNaN(Number(grupoId));
  const podeUsarApi = usuarioLogadoId != null && grupoIdNumerico;

  const idCriador = idCriadorDoGrupo(grupoApi);
  const isCriador =
    podeUsarApi && idCriador != null && String(idCriador) === String(usuarioLogadoId);

  const nomeExibicao = grupoApi?.nome != null ? String(grupoApi.nome) : String(params.nome ?? 'Grupo');
  const descricaoExibicao =
    grupoApi?.descricao != null ? String(grupoApi.descricao) : String(params.descricao ?? '');
  const codigoAcesso =
    grupoApi?.codigoAcesso != null ? String(grupoApi.codigoAcesso) : '';

  const membrosExibicao = (() => {
    if (grupoApi?.membros != null) return Number(grupoApi.membros);
    if (grupoApi?.totalMembros != null) return Number(grupoApi.totalMembros);
    if (params.membros != null) return Number(params.membros);
    return Math.max(rankingApi.length, 1);
  })();

  const pontosTotaisRanking = rankingApi.reduce((acc, r) => acc + (Number(r.pontos) || 0), 0);

  const abrirMenu = () => {
    if (!grupoIdNumerico) return;
    setMenuVisivel(true);
  };

  const abrirEditar = () => {
    setMenuVisivel(false);
    setNomeEdicao(nomeExibicao);
    setDescricaoEdicao(descricaoExibicao);
    setEditarVisivel(true);
  };

  const abrirConfirmarSair = () => {
    setMenuVisivel(false);
    if (!podeUsarApi) {
      Alert.alert(
        'Sessao',
        'Nao foi possivel identificar seu usuario. Volte para Meus Grupos e abra o grupo apos o login.'
      );
      return;
    }
    setConfirmarSairVisivel(true);
  };

  const executarSairDoGrupo = async () => {
    const { grupoId: gid, usuarioId: uid } = sairRef.current;
    if (!uid || !gid || gid === 'geral' || Number.isNaN(Number(gid))) {
      setConfirmarSairVisivel(false);
      return;
    }
    const gNum = Number(gid);
    const uNum = Number(uid);
    if (Number.isNaN(gNum) || Number.isNaN(uNum)) {
      setConfirmarSairVisivel(false);
      return;
    }

    setSaindo(true);
    try {
      const resposta = await fetch(`${API_URL}/api/grupos/sair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: uNum, grupoId: gNum }),
      });

      setConfirmarSairVisivel(false);

      if (resposta.status === 204) {
        navigation.goBack();
        return;
      }

      const dados = await lerResposta(resposta);
      const msg =
        typeof dados === 'object' && dados !== null
          ? dados.mensagem || dados.message || dados.error
          : dados;
      if (resposta.status === 404) {
        Alert.alert('Erro', String(msg || 'Grupo nao encontrado ou voce nao e membro.'));
        return;
      }
      if (resposta.status === 400) {
        Alert.alert('Erro', String(msg || 'Dados invalidos.'));
        return;
      }
      Alert.alert('Erro', String(msg || `Status ${resposta.status}`));
    } catch (e) {
      console.log(e);
      setConfirmarSairVisivel(false);
      Alert.alert('Conexao', 'Falha ao sair do grupo.');
    } finally {
      setSaindo(false);
    }
  };

  const salvarEdicaoGrupo = async () => {
    if (!podeUsarApi || !isCriador) {
      setEditarVisivel(false);
      return;
    }
    const nome = nomeEdicao.trim();
    if (nome === '') {
      Alert.alert('Atencao', 'O nome do grupo e obrigatorio.');
      return;
    }

    setSalvandoEdicao(true);
    try {
      const resposta = await fetch(`${API_URL}/api/grupos/${grupoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao: descricaoEdicao.trim(),
          usuarioId: Number(usuarioLogadoId),
        }),
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        const msg =
          typeof dados === 'object' && dados !== null
            ? dados.mensagem || dados.message || dados.error
            : dados;
        Alert.alert('Erro', String(msg || `Nao foi possivel atualizar (${resposta.status}).`));
        return;
      }

      if (dados && typeof dados === 'object') {
        setGrupoApi(dados);
      } else {
        await carregarDoServidor();
      }
      setEditarVisivel(false);
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao salvar alteracoes.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const carregarDoServidor = useCallback(async () => {
    if (!grupoId || grupoId === 'geral' || Number.isNaN(Number(grupoId))) {
      setCarregandoApi(false);
      setGrupoApi(null);
      setRankingApi([]);
      return;
    }

    setCarregandoApi(true);
    try {
      const urlGrupo = `${API_URL}/api/grupos/${grupoId}`;
      const urlRanking = `${API_URL}/api/grupos/${grupoId}/ranking`;

      const [resGrupo, resRanking] = await Promise.all([fetch(urlGrupo), fetch(urlRanking)]);

      const dadosGrupo = await lerResposta(resGrupo);
      const dadosRanking = await lerResposta(resRanking);

      if (!resGrupo.ok) {
        const msg =
          typeof dadosGrupo === 'object' && dadosGrupo !== null
            ? dadosGrupo.mensagem || dadosGrupo.message
            : dadosGrupo;
        Alert.alert('Grupo', String(msg || `Erro ${resGrupo.status}`));
        setGrupoApi(null);
      } else if (dadosGrupo && typeof dadosGrupo === 'object') {
        setGrupoApi(dadosGrupo);
      } else {
        setGrupoApi(null);
      }

      if (!resRanking.ok) {
        setRankingApi([]);
      } else if (Array.isArray(dadosRanking)) {
        setRankingApi(dadosRanking.map((linha, i) => mapRankingLinha(linha, i, usuarioLogadoId)));
      } else {
        setRankingApi([]);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao buscar dados do grupo.');
      setGrupoApi(null);
      setRankingApi([]);
    } finally {
      setCarregandoApi(false);
    }
  }, [grupoId, usuarioLogadoId]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const run = async () => {
        await carregarDoServidor();
        if (!ativo) return;
        const posts = POSTS_GLOBAIS.filter((p) => String(p.grupoId) === String(grupoId));
        setCheckinsLocais(posts);
      };

      void run();
      return () => {
        ativo = false;
      };
    }, [carregarDoServidor, grupoId])
  );

  const renderCheckin = ({ item }: any) => {
    const nome = item.nome ?? 'Usuario';
    const iniciais = nome.length >= 2 ? nome.substring(0, 2).toUpperCase() : '?';
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View
            style={[styles.postAvatar, { backgroundColor: nome === 'Voce' || nome === 'Você' ? '#FF8C00' : '#0B2046' }]}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{iniciais}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: 'bold', color: '#0B2046' }}>{nome}</Text>
            <Text style={{ color: '#999', fontSize: 12 }}>{item.tempo ?? ''}</Text>
          </View>
        </View>

        <View
          style={[
            styles.postImagePlaceholder,
            { backgroundColor: '#F9F9F9', height: 120, justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Feather name="image" size={32} color="#DDD" />
        </View>

        <View style={{ padding: 15 }}>
          <Text style={styles.postTitle}>{item.titulo ?? ''}</Text>
          <Text style={styles.postDesc}>{item.desc ?? ''}</Text>
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
            <Feather name="heart" size={18} color="#666" />
            <Text style={{ color: '#666', marginLeft: 5 }}>{item.likes ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="message-circle" size={18} color="#666" />
            <Text style={{ color: '#666', marginLeft: 5 }}>{item.comments ?? 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRanking = ({ item }: any) => {
    const nome = item.nome || '?';
    const iniciais = nome.length >= 2 ? nome.substring(0, 2).toUpperCase() : '?';
    return (
      <View style={[styles.rankCard, item.destaque && styles.rankCardDestaque]}>
        <Text style={styles.rankPos}>{item.pos}</Text>
        <View
          style={[styles.postAvatar, { backgroundColor: item.destaque ? '#FF8C00' : '#E0E0E0', width: 40, height: 40 }]}
        >
          <Text style={{ color: item.destaque ? '#FFF' : '#333', fontWeight: 'bold' }}>{iniciais}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: 'bold', color: item.destaque ? '#FF8C00' : '#0B2046', fontSize: 16 }}>
            {nome}
          </Text>
          <Text style={{ color: '#666' }}>{item.pontos} pontos</Text>
        </View>
        {item.destaque && (
          <View style={{ backgroundColor: '#FF8C00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Voce</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.homeContainer}>
      <View style={[styles.grupoHeaderTop, { justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, right: 8 }}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.grupoHeaderTitle, { flex: 1, minWidth: 0, marginRight: 8 }]} numberOfLines={1}>
          {nomeExibicao}
        </Text>
        {grupoIdNumerico && (
          <Pressable
            onPress={abrirMenu}
            hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
            style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="more-vertical" size={24} color="#FFF" />
          </Pressable>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('Checkin', { id: grupoId })}
          hitSlop={{ top: 12, bottom: 12, left: 8 }}
          style={{ padding: 6 }}
        >
          <Feather name="camera" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.grupoCover}>
        {carregandoApi ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Feather name="users" size={16} color="#FFF" />
              <Text style={styles.grupoCoverText}>{membrosExibicao} membro(s)</Text>
              <Feather name="award" size={16} color="#FFF" style={{ marginLeft: 10 }} />
              <Text style={styles.grupoCoverText}>{pontosTotaisRanking} pts (ranking)</Text>
            </View>
            {descricaoExibicao !== '' && (
              <Text style={[styles.grupoCoverText, { marginTop: 10, opacity: 0.95 }]} numberOfLines={4}>
                {descricaoExibicao}
              </Text>
            )}
            {codigoAcesso !== '' && (
              <Text style={[styles.grupoCoverText, { marginTop: 8, fontSize: 12, opacity: 0.85 }]}>
                Codigo: {codigoAcesso}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'checkins' && styles.tabActive]}
          onPress={() => setAbaAtiva('checkins')}
        >
          <Feather name="grid" size={16} color={abaAtiva === 'checkins' ? '#FF8C00' : '#666'} />
          <Text style={[styles.tabText, abaAtiva === 'checkins' && styles.tabTextActive, { marginLeft: 6 }]}>
            Check-ins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'ranking' && styles.tabActive]}
          onPress={() => setAbaAtiva('ranking')}
        >
          <Feather name="trending-up" size={16} color={abaAtiva === 'ranking' ? '#FF8C00' : '#666'} />
          <Text style={[styles.tabText, abaAtiva === 'ranking' && styles.tabTextActive, { marginLeft: 6 }]}>
            Ranking
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, minHeight: 0 }}>
        {abaAtiva === 'checkins' ? (
          <FlatList
            style={{ flex: 1 }}
            data={checkinsLocais}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCheckin}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 20 }}>
                <Feather name="edit-3" size={40} color="#DDD" />
                <Text style={{ color: '#AAA', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  Check-ins ainda nao vinculados ao banco. Use a camera no topo ou integre uma rota na API.
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={rankingApi}
            keyExtractor={(item) => item.id}
            renderItem={renderRanking}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 48 }}>
                <Feather name="bar-chart-2" size={40} color="#EEE" />
                <Text style={{ color: '#AAA', fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                  {carregandoApi ? 'Carregando ranking...' : 'Nenhum dado de ranking ainda.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Modal transparent visible={menuVisivel} animationType="fade" onRequestClose={() => setMenuVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisivel(false)}>
          <Pressable style={[styles.modalContainer, { padding: 0, overflow: 'hidden' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { padding: 16, paddingBottom: 8 }]}>Opcoes</Text>
            {isCriador && (
              <TouchableOpacity
                style={[styles.modalActionBtn, { borderBottomWidth: 1, borderBottomColor: '#EEE' }]}
                onPress={abrirEditar}
              >
                <Feather name="edit-2" size={20} color="#0B2046" style={styles.modalActionIcon} />
                <Text style={styles.modalActionText}>Editar grupo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalActionBtn} onPress={abrirConfirmarSair}>
              <Feather name="log-out" size={20} color="#FF3B30" style={styles.modalActionIcon} />
              <Text style={[styles.modalActionText, { color: '#FF3B30' }]}>Sair do grupo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, { justifyContent: 'center' }]} onPress={() => setMenuVisivel(false)}>
              <Text style={[styles.modalActionText, { color: '#999' }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={confirmarSairVisivel} animationType="fade" onRequestClose={() => setConfirmarSairVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !saindo && setConfirmarSairVisivel(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Sair do grupo?</Text>
            <Text style={{ color: '#666', marginBottom: 20, lineHeight: 22 }}>
              Voce deixa de participar deste grupo no servidor.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF3B30', marginBottom: 10 }]}
              onPress={() => void executarSairDoGrupo()}
              disabled={saindo}
            >
              <Text style={styles.buttonText}>{saindo ? 'Saindo...' : 'Sim, sair'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setConfirmarSairVisivel(false)} disabled={saindo}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={editarVisivel} animationType="slide" onRequestClose={() => setEditarVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !salvandoEdicao && setEditarVisivel(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar grupo</Text>
              <TouchableOpacity onPress={() => !salvandoEdicao && setEditarVisivel(false)}>
                <Feather name="x" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nomeEdicao} onChangeText={setNomeEdicao} placeholder="Nome do grupo" />
            <Text style={styles.label}>Descricao</Text>
            <TextInput
              style={[styles.input, { height: 88, textAlignVertical: 'top' }]}
              value={descricaoEdicao}
              onChangeText={setDescricaoEdicao}
              placeholder="Descricao"
              multiline
            />
            <TouchableOpacity style={styles.button} onPress={() => void salvarEdicaoGrupo()} disabled={salvandoEdicao}>
              <Text style={styles.buttonText}>{salvandoEdicao ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
