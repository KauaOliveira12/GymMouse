import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput, Pressable, Image, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MapWrapper from './MapWrapper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { POSTS_GLOBAIS } from './checkin';

const aguardarFechamentoModal = () =>
  new Promise<void>((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 350 : 120));

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
  const pontos = Number(raw.pontosDesdeEntrada ?? raw.pontos ?? raw.pontuacao ?? raw.score ?? 0);
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

function textoRegrasPontuacao(grupo: any): string {
  const base = Number(grupo?.pontosPorCheckin ?? 1) || 1;
  const dias = Number(grupo?.diasSequenciaParaBonus ?? 0);
  const mult = Number(grupo?.multiplicadorSequencia ?? 1) || 1;
  const ptsLabel = base === 1 ? '1 ponto' : `${base} pontos`;
  if (dias <= 0) return `${ptsLabel} por check-in`;
  const multFmt = Number.isInteger(mult) ? String(mult) : mult.toFixed(1);
  return `${ptsLabel}/check-in · ${dias} dias seguidos = x${multFmt}`;
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
  const { styles, palette } = useTheme();
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
  const [excluindo, setExcluindo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [curtindoId, setCurtindoId] = useState<string | null>(null);

  const [menuVisivel, setMenuVisivel] = useState(false);
  const [confirmarSairVisivel, setConfirmarSairVisivel] = useState(false);
  const [confirmarExcluirVisivel, setConfirmarExcluirVisivel] = useState(false);
  const [editarVisivel, setEditarVisivel] = useState(false);
  const [comentariosVisivel, setComentariosVisivel] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [descricaoEdicao, setDescricaoEdicao] = useState('');
  const [imagemCapaEdicao, setImagemCapaEdicao] = useState<string | null>(null);
  const [imagemCapaOriginal, setImagemCapaOriginal] = useState<string | null>(null);
  const [pontosPorCheckinEdicao, setPontosPorCheckinEdicao] = useState('1');
  const [diasSequenciaEdicao, setDiasSequenciaEdicao] = useState('3');
  const [multiplicadorSequenciaEdicao, setMultiplicadorSequenciaEdicao] = useState('2');
  const [bonusSequenciaEdicao, setBonusSequenciaEdicao] = useState(true);
  const [menuCapaVisivel, setMenuCapaVisivel] = useState(false);
  const [checkinSelecionado, setCheckinSelecionado] = useState<any>(null);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [textoComentario, setTextoComentario] = useState('');
  const [comentarioRespondendo, setComentarioRespondendo] = useState<any>(null);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

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
  const imagemCapaExibicao =
    grupoApi?.imagemCapa != null && String(grupoApi.imagemCapa).trim() !== ''
      ? String(grupoApi.imagemCapa)
      : null;
  const regrasPontuacaoTexto = grupoApi ? textoRegrasPontuacao(grupoApi) : null;

  const membrosExibicao = (() => {
    if (grupoApi?.totalMembros != null) return Number(grupoApi.totalMembros);
    if (grupoApi?.membros != null) return Number(grupoApi.membros);
    if (!carregandoApi && rankingApi.length > 0) return rankingApi.length;
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
    setImagemCapaEdicao(imagemCapaExibicao);
    setImagemCapaOriginal(imagemCapaExibicao);
    const pontosBase = Number(grupoApi?.pontosPorCheckin ?? 1) || 1;
    const diasBonus = Number(grupoApi?.diasSequenciaParaBonus ?? 0);
    const mult = Number(grupoApi?.multiplicadorSequencia ?? 2) || 2;
    setPontosPorCheckinEdicao(String(pontosBase));
    setBonusSequenciaEdicao(diasBonus > 0);
    setDiasSequenciaEdicao(diasBonus > 0 ? String(diasBonus) : '3');
    setMultiplicadorSequenciaEdicao(String(mult));
    setEditarVisivel(true);
  };

  const aplicarCapaSelecionada = (resultado: ImagePicker.ImagePickerResult) => {
    if (resultado.canceled) return;
    const asset = resultado.assets[0];
    setImagemCapaEdicao(
      asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri
    );
  };

  const tirarFotoCapa = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Permissao negada', 'Precisamos de acesso a camera para alterar a capa.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    aplicarCapaSelecionada(resultado);
  };

  const escolherCapaDaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Permissao negada', 'Precisamos de acesso a galeria para escolher a capa.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    aplicarCapaSelecionada(resultado);
  };

  const escolherOpcaoCapa = async (acao: () => Promise<void>) => {
    setMenuCapaVisivel(false);
    await aguardarFechamentoModal();
    await acao();
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

  const abrirConfirmarExcluir = () => {
    setMenuVisivel(false);
    if (!podeUsarApi || !isCriador) return;
    setConfirmarExcluirVisivel(true);
  };

  const executarExcluirGrupo = async () => {
    if (!podeUsarApi || !isCriador || !usuarioLogadoId) {
      setConfirmarExcluirVisivel(false);
      return;
    }

    setExcluindo(true);
    try {
      const resposta = await fetch(
        `${API_URL}/api/grupos/${grupoId}?usuarioId=${encodeURIComponent(usuarioLogadoId)}`,
        { method: 'DELETE' }
      );

      setConfirmarExcluirVisivel(false);

      if (resposta.status === 204) {
        navigation.goBack();
        return;
      }

      const dados = await lerResposta(resposta);
      const msg =
        typeof dados === 'object' && dados !== null
          ? dados.mensagem || dados.message || dados.error
          : dados;
      if (resposta.status === 403) {
        Alert.alert('Erro', String(msg || 'Somente o criador pode excluir este grupo.'));
        return;
      }
      if (resposta.status === 404) {
        Alert.alert('Erro', String(msg || 'Grupo nao encontrado.'));
        navigation.goBack();
        return;
      }
      Alert.alert('Erro', String(msg || `Nao foi possivel excluir (${resposta.status}).`));
    } catch (e) {
      console.log(e);
      setConfirmarExcluirVisivel(false);
      Alert.alert('Conexao', 'Falha ao excluir o grupo.');
    } finally {
      setExcluindo(false);
    }
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

    const pontosBase = Math.max(1, parseInt(pontosPorCheckinEdicao, 10) || 1);
    const payload: Record<string, unknown> = {
      nome,
      descricao: descricaoEdicao.trim(),
      usuarioId: Number(usuarioLogadoId),
      pontosPorCheckin: pontosBase,
    };
    if (imagemCapaEdicao !== imagemCapaOriginal) {
      payload.imagemCapa = imagemCapaEdicao?.trim() ?? '';
    }
    if (bonusSequenciaEdicao) {
      const dias = Math.max(1, parseInt(diasSequenciaEdicao, 10) || 3);
      const mult = parseFloat(multiplicadorSequenciaEdicao.replace(',', '.')) || 1;
      payload.diasSequenciaParaBonus = dias;
      payload.multiplicadorSequencia = mult > 0 ? mult : 1;
    } else {
      payload.diasSequenciaParaBonus = 0;
    }

    setSalvandoEdicao(true);
    try {
      const resposta = await fetch(`${API_URL}/api/grupos/${grupoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const urlCheckins = `${API_URL}/api/grupos/${grupoId}/checkins${usuarioLogadoId ? `?usuarioId=${usuarioLogadoId}` : ''
        }`;

      const [resGrupo, resRanking, resCheckins] = await Promise.all([
        fetch(urlGrupo),
        fetch(urlRanking),
        fetch(urlCheckins),
      ]);

      const dadosGrupo = await lerResposta(resGrupo);
      const dadosRanking = await lerResposta(resRanking);
      const dadosCheckins = await lerResposta(resCheckins);

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

      if (resCheckins.ok && Array.isArray(dadosCheckins)) {
        setCheckinsLocais(dadosCheckins);
      } else {
        const posts = POSTS_GLOBAIS.filter((p) => String(p.grupoId) === String(grupoId));
        setCheckinsLocais(posts);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao buscar dados do grupo.');
      setGrupoApi(null);
      setRankingApi([]);
      const posts = POSTS_GLOBAIS.filter((p) => String(p.grupoId) === String(grupoId));
      setCheckinsLocais(posts);
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
      };

      void run();
      return () => {
        ativo = false;
      };
    }, [carregarDoServidor, grupoId])
  );

  const atualizarCheckinNaLista = (checkinAtualizado: any) => {
    if (!checkinAtualizado || checkinAtualizado.id == null) return;
    setCheckinsLocais((atuais) =>
      atuais.map((item) => (String(item.id) === String(checkinAtualizado.id) ? { ...item, ...checkinAtualizado } : item))
    );
    setCheckinSelecionado((atual: any) =>
      atual && String(atual.id) === String(checkinAtualizado.id) ? { ...atual, ...checkinAtualizado } : atual
    );
  };

  const handleCurtir = async (item: any) => {
    if (!podeUsarApi) {
      Alert.alert('Sessao', 'Faca login novamente para curtir.');
      return;
    }
    const checkinId = item?.id;
    if (checkinId == null || curtindoId === String(checkinId)) return;

    setCurtindoId(String(checkinId));
    try {
      const resposta = await fetch(`${API_URL}/api/checkins/${checkinId}/curtidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: Number(usuarioLogadoId) }),
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        Alert.alert('Erro', `Nao foi possivel atualizar a curtida (${resposta.status}).`);
        return;
      }
      atualizarCheckinNaLista(dados);
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao curtir o check-in.');
    } finally {
      setCurtindoId(null);
    }
  };

  const abrirComentarios = async (item: any) => {
    setCheckinSelecionado(item);
    setComentariosVisivel(true);
    setComentarios([]);
    setTextoComentario('');
    setComentarioRespondendo(null);
    setCarregandoComentarios(true);

    try {
      const resposta = await fetch(`${API_URL}/api/checkins/${item.id}/comentarios`);
      const dados = await lerResposta(resposta);
      if (resposta.ok && Array.isArray(dados)) {
        setComentarios(dados);
      } else {
        setComentarios([]);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao carregar comentarios.');
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const adicionarRespostaAoComentario = (lista: any[], resposta: any): any[] =>
    lista.map((comentario) => {
      if (String(comentario.id) === String(resposta.comentarioPaiId)) {
        return {
          ...comentario,
          respostas: [...(Array.isArray(comentario.respostas) ? comentario.respostas : []), resposta],
        };
      }

      if (Array.isArray(comentario.respostas) && comentario.respostas.length > 0) {
        return {
          ...comentario,
          respostas: adicionarRespostaAoComentario(comentario.respostas, resposta),
        };
      }

      return comentario;
    });

  const enviarComentario = async () => {
    const texto = textoComentario.trim();
    if (!podeUsarApi || !checkinSelecionado?.id) {
      Alert.alert('Sessao', 'Faca login novamente para comentar.');
      return;
    }
    if (!texto) {
      Alert.alert('Comentario', 'Digite uma mensagem.');
      return;
    }

    setEnviandoComentario(true);
    try {
      const comentarioPaiId = comentarioRespondendo?.id;
      const url = comentarioPaiId
        ? `${API_URL}/api/checkins/${checkinSelecionado.id}/comentarios/${comentarioPaiId}/respostas`
        : `${API_URL}/api/checkins/${checkinSelecionado.id}/comentarios`;
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: Number(usuarioLogadoId), texto }),
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        Alert.alert('Erro', `Nao foi possivel comentar (${resposta.status}).`);
        return;
      }

      setComentarios((atuais) =>
        dados?.comentarioPaiId ? adicionarRespostaAoComentario(atuais, dados) : [...atuais, dados]
      );
      setTextoComentario('');
      setComentarioRespondendo(null);
      const novoTotal = Number(checkinSelecionado.comments ?? 0) + 1;
      atualizarCheckinNaLista({ ...checkinSelecionado, comments: novoTotal });
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Falha ao enviar comentario.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const renderComentario = (item: any, nivel = 0) => {
    const nome = item.nome ?? 'Usuario';
    const iniciais = nome.length >= 2 ? nome.substring(0, 2).toUpperCase() : '?';
    const respostas = Array.isArray(item.respostas) ? item.respostas : [];
    const indentacao = Math.min(nivel * 18, 54);

    return (
      <View style={{ marginLeft: indentacao, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.postAvatar, { width: 34, height: 34, marginRight: 10 }]}>
            <Text style={{ color: palette.white, fontWeight: 'bold', fontSize: 12 }}>{iniciais}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: palette.surfaceSecondary, borderRadius: 8, padding: 10 }}>
              <Text style={{ color: palette.title, fontWeight: 'bold', marginBottom: 4 }}>{nome}</Text>
              <Text style={{ color: palette.text, lineHeight: 20 }}>{item.texto}</Text>
            </View>
            <TouchableOpacity
              style={{ alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4 }}
              onPress={() => {
                setComentarioRespondendo(item);
                setTextoComentario('');
              }}
            >
              <Text style={{ color: palette.accent, fontWeight: '700', fontSize: 12 }}>Responder</Text>
            </TouchableOpacity>
          </View>
        </View>
        {respostas.map((resposta: any) => (
          <View key={String(resposta.id)} style={{ marginTop: 8 }}>
            {renderComentario(resposta, nivel + 1)}
          </View>
        ))}
      </View>
    );
  };

  const renderCheckin = ({ item }: any) => {
    const nome = item.nome ?? 'Usuario';
    const iniciais = nome.length >= 2 ? nome.substring(0, 2).toUpperCase() : '?';
    const curtido = Boolean(item.curtido);
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View
            style={[styles.postAvatar, { backgroundColor: nome === 'Voce' || nome === 'Você' ? palette.accent : palette.title }]}
          >
            <Text style={{ color: palette.white, fontWeight: 'bold' }}>{iniciais}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: 'bold', color: palette.title }}>{nome}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>{item.tempo ?? ''}</Text>
          </View>
        </View>

        {item.imagem ? (
          <Image
            source={{ uri: item.imagem }}
            style={[styles.postImagePlaceholder, { height: 180, backgroundColor: palette.surfaceSecondary }]}
          />
        ) : (
          <View
            style={[
              styles.postImagePlaceholder,
              { backgroundColor: palette.surfaceSecondary, height: 120, justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Feather name="image" size={32} color={palette.imagePlaceholder} />
          </View>
        )}

        <View style={{ padding: 15 }}>
          <Text style={styles.postTitle}>{item.titulo ?? ''}</Text>
          {item.desc ? <Text style={styles.postDesc}>{item.desc}</Text> : null}

          {/* --- MAPA ESTÁTICO DO CHECK-IN --- */}
          {item.latitude && item.longitude && (
            <View style={{ marginTop: 12 }}>
              {item.nomeLocal && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Feather name="map-pin" size={14} color={palette.accent} />
                  <Text style={{ marginLeft: 4, color: palette.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                    {item.nomeLocal}
                  </Text>
                </View>
              )}
              <View style={{ borderRadius: 8, overflow: 'hidden', height: 120 }}>
                <MapWrapper latitude={Number(item.latitude)} longitude={Number(item.longitude)} />
              </View>
            </View>
          )}
          {/* --------------------------------- */}

        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, opacity: curtindoId === String(item.id) ? 0.6 : 1 }}
            onPress={() => void handleCurtir(item)}
            disabled={curtindoId === String(item.id)}
          >
            <Feather name="heart" size={18} color={curtido ? '#FF3B30' : palette.textSecondary} />
            <Text style={{ color: curtido ? '#FF3B30' : palette.textSecondary, marginLeft: 5 }}>{item.likes ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => void abrirComentarios(item)}>
            <Feather name="message-circle" size={18} color={palette.textSecondary} />
            <Text style={{ color: palette.textSecondary, marginLeft: 5 }}>{item.comments ?? 0}</Text>
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
          style={[styles.postAvatar, { backgroundColor: item.destaque ? palette.accent : palette.avatarAlt, width: 40, height: 40 }]}
        >
          <Text style={{ color: item.destaque ? palette.white : palette.text, fontWeight: 'bold' }}>{iniciais}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: 'bold', color: item.destaque ? palette.accent : palette.title, fontSize: 16 }}>
            {nome}
          </Text>
          <Text style={{ color: palette.textSecondary }}>{item.pontos} pontos</Text>
        </View>
        {item.destaque && (
          <View style={{ backgroundColor: palette.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: palette.white, fontSize: 10, fontWeight: 'bold' }}>Voce</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.homeContainer}>
      <View style={[styles.grupoHeaderTop, { justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, right: 8 }}>
          <Feather name="chevron-left" size={28} color={palette.headerText} />
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
            <Feather name="more-vertical" size={24} color={palette.headerText} />
          </Pressable>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { id: grupoId, nome: nomeExibicao, usuarioId: usuarioLogadoId })}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={{ padding: 6 }}
        >
          <Feather name="message-circle" size={22} color={palette.headerText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Checkin', { id: grupoId, usuarioId: usuarioLogadoId })}
          hitSlop={{ top: 12, bottom: 12, left: 8 }}
          style={{ padding: 6 }}
        >
          <Feather name="camera" size={22} color={palette.headerText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.grupoCover, imagemCapaExibicao ? { height: 180 } : { height: 120 }]}>
        {imagemCapaExibicao && (
          <>
            <Image source={{ uri: imagemCapaExibicao }} style={styles.grupoCoverImage} resizeMode="cover" />
            <View style={styles.grupoCoverOverlay} />
          </>
        )}
        {carregandoApi ? (
          <ActivityIndicator color={palette.headerText} style={{ zIndex: 1 }} />
        ) : (
          <View style={styles.grupoCoverContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Feather name="users" size={16} color={palette.headerText} />
              <Text style={[styles.grupoCoverText, imagemCapaExibicao && { color: palette.white }]}>
                {membrosExibicao} membro(s)
              </Text>
              <Feather name="award" size={16} color={palette.headerText} style={{ marginLeft: 10 }} />
              <Text style={[styles.grupoCoverText, imagemCapaExibicao && { color: palette.white }]}>
                {pontosTotaisRanking} pts (ranking)
              </Text>
            </View>
            {regrasPontuacaoTexto && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Feather name="zap" size={14} color={palette.accent} />
                <Text
                  style={[
                    styles.grupoCoverText,
                    { marginTop: 0, marginLeft: 6, color: imagemCapaExibicao ? '#FFE0B2' : palette.accent },
                  ]}
                >
                  {regrasPontuacaoTexto}
                </Text>
              </View>
            )}
            {descricaoExibicao !== '' && (
              <Text
                style={[styles.grupoCoverText, { marginTop: 10, opacity: 0.95, color: imagemCapaExibicao ? '#EEE' : '#CCC' }]}
                numberOfLines={4}
              >
                {descricaoExibicao}
              </Text>
            )}
            {codigoAcesso !== '' && (
              <Text
                style={[
                  styles.grupoCoverText,
                  { marginTop: 8, fontSize: 12, opacity: 0.85, color: imagemCapaExibicao ? '#DDD' : '#CCC' },
                ]}
              >
                Codigo: {codigoAcesso}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'checkins' && styles.tabActive]}
          onPress={() => setAbaAtiva('checkins')}
        >
          <Feather name="grid" size={16} color={abaAtiva === 'checkins' ? palette.accent : palette.textSecondary} />
          <Text style={[styles.tabText, abaAtiva === 'checkins' && styles.tabTextActive, { marginLeft: 6 }]}>
            Check-ins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'ranking' && styles.tabActive]}
          onPress={() => setAbaAtiva('ranking')}
        >
          <Feather name="trending-up" size={16} color={abaAtiva === 'ranking' ? palette.accent : palette.textSecondary} />
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
                <Feather name="edit-3" size={40} color={palette.imagePlaceholder} />
                <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  Nenhum check-in neste grupo ainda.
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
                <Feather name="bar-chart-2" size={40} color={palette.border} />
                <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                  {carregandoApi ? 'Carregando ranking...' : 'Nenhum dado de ranking ainda.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Restante dos modais permanecem sem alteração visual */}
      <Modal transparent visible={comentariosVisivel} animationType="slide" onRequestClose={() => setComentariosVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !enviandoComentario && setComentariosVisivel(false)}>
          <Pressable style={[styles.modalContainer, { maxHeight: '82%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comentarios</Text>
              <TouchableOpacity onPress={() => !enviandoComentario && setComentariosVisivel(false)}>
                <Feather name="x" size={24} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            {checkinSelecionado && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: palette.title, fontWeight: 'bold' }}>{checkinSelecionado.titulo}</Text>
                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                  {checkinSelecionado.desc}
                </Text>
              </View>
            )}

            {carregandoComentarios ? (
              <ActivityIndicator color={palette.accent} style={{ marginVertical: 24 }} />
            ) : (
              <FlatList
                data={comentarios}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 260 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={{ color: palette.textMuted, textAlign: 'center', marginVertical: 24 }}>
                    Nenhum comentario ainda.
                  </Text>
                }
                renderItem={({ item }) => renderComentario(item)}
              />
            )}

            {comentarioRespondendo && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: palette.rankHighlight,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  marginTop: 10,
                }}
              >
                <Text style={{ color: palette.title, flex: 1 }} numberOfLines={1}>
                  Respondendo {comentarioRespondendo.nome ?? 'comentario'}
                </Text>
                <TouchableOpacity onPress={() => setComentarioRespondendo(null)}>
                  <Feather name="x" size={18} color={palette.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                value={textoComentario}
                onChangeText={setTextoComentario}
                placeholder={comentarioRespondendo ? 'Escreva uma resposta' : 'Escreva um comentario'}
                editable={!enviandoComentario}
              />
              <TouchableOpacity
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 8,
                  backgroundColor: palette.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: enviandoComentario ? 0.6 : 1,
                }}
                onPress={() => void enviarComentario()}
                disabled={enviandoComentario}
              >
                <Feather name="send" size={20} color={palette.headerText} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={menuVisivel} animationType="fade" onRequestClose={() => setMenuVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisivel(false)}>
          <Pressable style={[styles.modalContainer, { padding: 0, overflow: 'hidden' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { padding: 16, paddingBottom: 8 }]}>Opcoes</Text>
            {isCriador && (
              <>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { borderBottomWidth: 1, borderBottomColor: palette.border }]}
                  onPress={abrirEditar}
                >
                  <Feather name="edit-2" size={20} color={palette.accent} style={styles.modalActionIcon} />
                  <Text style={styles.modalActionText}>Editar grupo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { borderBottomWidth: 1, borderBottomColor: palette.border }]}
                  onPress={abrirConfirmarExcluir}
                >
                  <Feather name="trash-2" size={20} color="#FF3B30" style={styles.modalActionIcon} />
                  <Text style={[styles.modalActionText, { color: '#FF3B30' }]}>Excluir grupo</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.modalActionBtn} onPress={abrirConfirmarSair}>
              <Feather name="log-out" size={20} color="#FF3B30" style={styles.modalActionIcon} />
              <Text style={[styles.modalActionText, { color: '#FF3B30' }]}>Sair do grupo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, { justifyContent: 'center' }]} onPress={() => setMenuVisivel(false)}>
              <Text style={[styles.modalActionText, { color: palette.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={confirmarExcluirVisivel}
        animationType="fade"
        onRequestClose={() => !excluindo && setConfirmarExcluirVisivel(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !excluindo && setConfirmarExcluirVisivel(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Excluir grupo?</Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 20, lineHeight: 22 }}>
              {`O grupo "${nomeExibicao}" será removido permanentemente, junto com membros, check-ins e ranking. Esta ação não pode ser desfeita.`}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF3B30', marginBottom: 10 }]}
              onPress={() => void executarExcluirGrupo()}
              disabled={excluindo}
            >
              <Text style={styles.buttonText}>{excluindo ? 'Excluindo...' : 'Sim, excluir'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setConfirmarExcluirVisivel(false)}
              disabled={excluindo}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={confirmarSairVisivel} animationType="fade" onRequestClose={() => setConfirmarSairVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !saindo && setConfirmarSairVisivel(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Sair do grupo?</Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 20, lineHeight: 22 }}>
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
          <Pressable style={[styles.modalContainer, { maxHeight: '90%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar grupo</Text>
              <TouchableOpacity onPress={() => !salvandoEdicao && setEditarVisivel(false)}>
                <Feather name="x" size={24} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Imagem de capa</Text>
              <TouchableOpacity style={styles.grupoCapaPreview} onPress={() => setMenuCapaVisivel(true)} disabled={salvandoEdicao}>
                {imagemCapaEdicao ? (
                  <Image source={{ uri: imagemCapaEdicao }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <>
                    <Feather name="image" size={32} color={palette.textMuted} />
                    <Text style={{ color: palette.textMuted, marginTop: 8 }}>Toque para escolher uma capa</Text>
                  </>
                )}
              </TouchableOpacity>
              {imagemCapaEdicao && (
                <TouchableOpacity
                  style={{ alignSelf: 'flex-start', marginBottom: 12, marginTop: -4 }}
                  onPress={() => setImagemCapaEdicao(null)}
                  disabled={salvandoEdicao}
                >
                  <Text style={styles.linkText}>Remover capa</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={nomeEdicao}
                onChangeText={setNomeEdicao}
                placeholder="Nome do grupo"
                editable={!salvandoEdicao}
              />
              <Text style={styles.label}>Descricao</Text>
              <TextInput
                style={[styles.input, { height: 88, textAlignVertical: 'top' }]}
                value={descricaoEdicao}
                onChangeText={setDescricaoEdicao}
                placeholder="Descricao"
                multiline
                editable={!salvandoEdicao}
              />

              <View style={styles.grupoRegrasBox}>
                <Text style={styles.grupoRegrasTitulo}>Regras de pontuacao</Text>
                <Text style={styles.label}>Pontos por check-in</Text>
                <TextInput
                  style={styles.input}
                  value={pontosPorCheckinEdicao}
                  onChangeText={setPontosPorCheckinEdicao}
                  placeholder="1"
                  keyboardType="number-pad"
                  editable={!salvandoEdicao}
                />
                <View style={styles.grupoSwitchRow}>
                  <Text style={{ color: palette.text, fontWeight: '600', flex: 1 }}>Bonus por dias seguidos</Text>
                  <TouchableOpacity
                    onPress={() => !salvandoEdicao && setBonusSequenciaEdicao((v) => !v)}
                    style={{
                      backgroundColor: bonusSequenciaEdicao ? palette.accent : palette.switchOff,
                      borderRadius: 14,
                      width: 48,
                      height: 28,
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      opacity: salvandoEdicao ? 0.6 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: palette.switchKnob,
                        alignSelf: bonusSequenciaEdicao ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </TouchableOpacity>
                </View>
                {bonusSequenciaEdicao ? (
                  <>
                    <Text style={styles.label}>Dias seguidos para ativar bonus</Text>
                    <TextInput
                      style={styles.input}
                      value={diasSequenciaEdicao}
                      onChangeText={setDiasSequenciaEdicao}
                      placeholder="3"
                      keyboardType="number-pad"
                      editable={!salvandoEdicao}
                    />
                    <Text style={styles.label}>Multiplicador (ex: 2 = dobrar)</Text>
                    <TextInput
                      style={styles.input}
                      value={multiplicadorSequenciaEdicao}
                      onChangeText={setMultiplicadorSequenciaEdicao}
                      placeholder="2"
                      keyboardType="decimal-pad"
                      editable={!salvandoEdicao}
                    />
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 4 }}>
                      Ex: 3 dias + multiplicador 2.0 = a partir do 3o dia, cada check-in vale o dobro.
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: palette.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Com o bonus desativado, cada check-in vale apenas os pontos base.
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.button} onPress={() => void salvarEdicaoGrupo()} disabled={salvandoEdicao}>
                <Text style={styles.buttonText}>{salvandoEdicao ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={menuCapaVisivel} animationType="fade" onRequestClose={() => setMenuCapaVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuCapaVisivel(false)}>
          <Pressable style={[styles.modalContainer, { padding: 0, overflow: 'hidden' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { padding: 16, paddingBottom: 8 }]}>Capa do grupo</Text>
            <TouchableOpacity
              style={[styles.modalActionBtn, { borderBottomWidth: 1, borderBottomColor: palette.border }]}
              onPress={() => void escolherOpcaoCapa(tirarFotoCapa)}
            >
              <Feather name="camera" size={20} color={palette.accent} style={styles.modalActionIcon} />
              <Text style={styles.modalActionText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionBtn, { borderBottomWidth: 1, borderBottomColor: palette.border }]}
              onPress={() => void escolherOpcaoCapa(escolherCapaDaGaleria)}
            >
              <Feather name="image" size={20} color={palette.accent} style={styles.modalActionIcon} />
              <Text style={styles.modalActionText}>Escolher da galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, { justifyContent: 'center' }]} onPress={() => setMenuCapaVisivel(false)}>
              <Text style={[styles.modalActionText, { color: palette.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
