import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

interface Mensagem {
  id: string;
  text: string;
  isMe: boolean;
  senderName: string;
  senderPic: string;
  timestamp: string;
  grupoId?: string;
}


const lerResposta = async (resposta: Response) => {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

const formatarMensagem = (item: any, usuarioId: string | null): Mensagem => {
  const data = item?.dataEnvio ? new Date(item.dataEnvio) : null;
  const timestamp =
    data && !Number.isNaN(data.getTime())
      ? data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
  const remetenteId = item?.usuario?.id ?? item?.usuarioId;

  return {
    id: String(item?.id ?? `${Date.now()}-${Math.random()}`),
    text: String(item?.conteudo ?? item?.text ?? ''),
    isMe: usuarioId != null && remetenteId != null && String(remetenteId) === usuarioId,
    senderName: String(item?.usuario?.nome ?? item?.senderName ?? 'Participante'),
    senderPic: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    timestamp,
    grupoId: item?.grupo?.id != null ? String(item.grupo.id) : item?.grupoId != null ? String(item.grupoId) : undefined,
  };
};

export default function Chat() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatStyles: styles, palette } = useTheme();
  const grupoId = route.params?.id != null ? String(route.params.id) : 'geral';
  const nomeGrupo = String(route.params?.nome ?? 'Chat do Grupo');
  const usuarioId =
    route.params?.usuarioId != null && String(route.params.usuarioId).trim() !== ''
      ? String(route.params.usuarioId)
      : null;

  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const flatListRef = useRef<FlatList<Mensagem>>(null);

  const carregarMensagens = useCallback(async () => {
    if (grupoId === 'geral' || Number.isNaN(Number(grupoId))) {
      setMensagens([]);
      setCarregando(false);
      setRefreshing(false);
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/api/chat/${grupoId}`);
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        Alert.alert('Chat', `Nao foi possivel carregar mensagens (${resposta.status}).`);
        setMensagens([]);
        return;
      }

      const lista = Array.isArray(dados) ? dados : [];
      setMensagens(lista.map((item) => formatarMensagem(item, usuarioId)));
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel conectar ao chat da API.');
      setMensagens([]);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [grupoId, usuarioId]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarMensagens();
    }, [carregarMensagens])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    carregarMensagens();
  };

  const enviarMensagem = async () => {
    const texto = mensagem.trim();
    if (!texto) return;

    if (!usuarioId) {
      Alert.alert('Sessao', 'Faca login novamente para enviar mensagens.');
      return;
    }
    if (grupoId === 'geral' || Number.isNaN(Number(grupoId))) {
      Alert.alert('Chat', 'Abra o chat por um grupo valido.');
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: texto,
          usuarioId: Number(usuarioId),
          grupoId: Number(grupoId),
        }),
      });
      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        Alert.alert('Chat', `Nao foi possivel enviar mensagem (${resposta.status}).`);
        return;
      }

      setMensagem('');
      if (dados && typeof dados === 'object') {
        setMensagens((atuais) => [...atuais, formatarMensagem(dados, usuarioId)]);
      } else {
        await carregarMensagens();
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Feather name="chevron-left" size={28} color={palette.headerText} />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://img.freepik.com/vetores-premium/logotipo-de-fitness-e-academia_127716-169.jpg' }}
          style={styles.avatarGrupo}
        />
        <Text style={styles.tituloHeader} numberOfLines={1}>
          {nomeGrupo}
        </Text>
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} size="large" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.msgContainer, item.isMe ? styles.msgDireita : styles.msgEsquerda]}>
              {!item.isMe && <Image source={{ uri: item.senderPic }} style={styles.avatarUser} />}
              <View style={[styles.balao, item.isMe ? styles.balaoMeu : styles.balaoOutro]}>
                {!item.isMe && <Text style={styles.nomeUser}>{item.senderName}</Text>}
                <Text style={item.isMe ? styles.textoMeu : styles.textoOutro}>{item.text}</Text>
                <Text style={styles.hora}>{item.timestamp}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.accent]} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma mensagem ainda.</Text>}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={palette.textMuted}
          value={mensagem}
          onChangeText={setMensagem}
          returnKeyType="send"
          onSubmitEditing={enviarMensagem}
        />
        <TouchableOpacity style={styles.botaoEnviar} onPress={enviarMensagem}>
          {enviando ? <ActivityIndicator color={palette.white} /> : <Feather name="send" size={20} color={palette.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
