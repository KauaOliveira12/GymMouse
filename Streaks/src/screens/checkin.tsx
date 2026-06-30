import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, Modal, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // <-- IMPORT DO GPS
import MapWrapper from './MapWrapper';
import { API_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

// Banco temporario em memoria. A tela de Grupo le estes dados enquanto a API de check-in nao existir.
export let POSTS_GLOBAIS: any[] = [];
export let PONTOS_GLOBAIS: Record<string, number> = {};

const aguardarFechamentoModal = () =>
  new Promise<void>((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 350 : 120));

export default function Checkin() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { styles, palette } = useTheme();
  const params = route.params ?? {};
  const grupoId = params.id != null ? String(params.id) : 'geral';
  const usuarioId = params.usuarioId != null ? String(params.usuarioId) : null;

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [menuFotoVisivel, setMenuFotoVisivel] = useState(false);

  // --- ESTADOS DE LOCALIZAÇÃO ---
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [nomeLocal, setNomeLocal] = useState<string | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  // --- FUNÇÃO PARA BUSCAR O GPS ---
  const handleIncluirLocalizacao = async () => {
    setBuscandoLocal(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso ao GPS para incluir a localização.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Pega o nome da rua/bairro
      const endereco = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (endereco.length > 0) {
        const bairro = endereco[0].district || endereco[0].subregion;
        const cidade = endereco[0].city || endereco[0].subregion;
        setNomeLocal(bairro ? `${bairro}, ${cidade}` : cidade);
      } else {
        setNomeLocal("Localização adicionada");
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível buscar a localização.');
    } finally {
      setBuscandoLocal(false);
    }
  };

  const aplicarResultado = (resultado: ImagePicker.ImagePickerResult) => {
    if (resultado.canceled) return;
    const asset = resultado.assets[0];
    setImagem(asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri);
  };

  const tirarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Permissao negada', 'Precisamos de acesso a camera para registrar seu treino.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [5, 6],
      quality: 0.8,
      base64: true,
    });
    aplicarResultado(resultado);
  };

  const escolherDaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Permissao negada', 'Precisamos de acesso a galeria para escolher uma foto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 6],
      quality: 0.8,
      base64: true,
    });
    aplicarResultado(resultado);
  };

  const handleSelecionarFoto = () => {
    setMenuFotoVisivel(true);
  };

  const escolherOpcao = async (acao: () => Promise<void>) => {
    setMenuFotoVisivel(false);
    await aguardarFechamentoModal();
    await acao();
  };

  const handleFinalizar = async () => {
    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();

    if (!usuarioId || grupoId === 'geral' || Number.isNaN(Number(grupoId))) {
      Alert.alert('Sessao', 'Abra o check-in a partir de um grupo apos fazer login.');
      return;
    }
    if (!tituloLimpo) {
      Alert.alert('Aviso', 'De um titulo ao seu treino.');
      return;
    }

    if (!imagem) {
      Alert.alert('Aviso', 'A foto do treino e obrigatoria para o check-in.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          grupoId: Number(grupoId),
          titulo: tituloLimpo,
          descricao: descricaoLimpa,
          imagem,
          nomeLocal: nomeLocal,       // <-- ENVIANDO LOCALIZAÇÃO
          latitude: latitude,         // <-- ENVIANDO LOCALIZAÇÃO
          longitude: longitude,       // <-- ENVIANDO LOCALIZAÇÃO
        }),
      });

      const texto = await resposta.text();
      let dados: any = null;
      if (texto) {
        try {
          dados = JSON.parse(texto);
        } catch {
          dados = texto;
        }
      }

      if (!resposta.ok) {
        const msg =
            typeof dados === 'object' && dados !== null
                ? dados.mensagem || dados.message || dados.error
                : dados;
        Alert.alert('Erro', String(msg || `Nao foi possivel salvar o check-in (${resposta.status}).`));
        return;
      }

      POSTS_GLOBAIS.unshift(dados);
      const pontosAtuais = PONTOS_GLOBAIS[grupoId] || 0;
      PONTOS_GLOBAIS[grupoId] = pontosAtuais + 1;

      Alert.alert('Sucesso!', 'Check-in realizado! Voce ganhou +1 ponto.');
      setTitulo('');
      setDescricao('');
      setImagem(null);
      setLatitude(null); // Limpando estado local
      setLongitude(null); // Limpando estado local
      setNomeLocal(null); // Limpando estado local
      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel conectar a API para salvar o check-in.');
    } finally {
      setSalvando(false);
    }
  };

  return (
      <View style={styles.homeContainer}>
        <View style={styles.grupoHeaderTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={palette.headerText} />
          </TouchableOpacity>
          <Text style={styles.grupoHeaderTitle}>Fazer Check-in</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          <Text style={styles.label}>Foto do Treino</Text>
          <TouchableOpacity
              style={{
                height: 200,
                backgroundColor: palette.imagePlaceholder,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: palette.border,
                overflow: 'hidden',
              }}
              onPress={handleSelecionarFoto}
          >
            {imagem ? (
                <Image source={{ uri: imagem }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <>
                  <Feather name="camera" size={40} color={palette.textMuted} />
                  <Text style={{ color: palette.textMuted, marginTop: 10 }}>Toque para adicionar uma foto</Text>
                </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Titulo do Treino</Text>
          <TextInput
              style={styles.input}
              placeholder="Ex: Treino de Pernas"
              placeholderTextColor={palette.textMuted}
              value={titulo}
              onChangeText={setTitulo}
          />

          <Text style={styles.label}>Descricao (opcional)</Text>
          <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Como foi o treino? O que voce fez?"
              placeholderTextColor={palette.textMuted}
              value={descricao}
              onChangeText={setDescricao}
              multiline
          />

          {/* --- SEÇÃO DE LOCALIZAÇÃO (OPCIONAL) --- */}
          <Text style={styles.label}>Localização (Opcional)</Text>
          {!latitude ? (
              <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.rankHighlight, padding: 12, borderRadius: 8, marginBottom: 20 }}
                  onPress={handleIncluirLocalizacao}
                  disabled={buscandoLocal}
              >
                <Feather name="map-pin" size={20} color={palette.accent} />
                <Text style={{ marginLeft: 10, color: palette.accent, fontWeight: 'bold' }}>
                  {buscandoLocal ? 'Buscando localização...' : 'Incluir localização'}
                </Text>
              </TouchableOpacity>
          ) : (
              <View style={{ marginBottom: 20 }}>
                {nomeLocal && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="map-pin" size={16} color={palette.accent} />
                      <Text style={{ marginLeft: 6, fontWeight: 'bold', color: palette.textSecondary }}>{nomeLocal}</Text>
                    </View>
                )}
                <View style={{ borderRadius: 12, overflow: 'hidden', height: 150 }}>
                  <MapWrapper latitude={latitude as number} longitude={longitude as number} />
                </View>
                <TouchableOpacity onPress={() => { setLatitude(null); setLongitude(null); setNomeLocal(null); }} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#FF3B30', fontSize: 14 }}>Remover localização</Text>
                </TouchableOpacity>
              </View>
          )}
          {/* --------------------------------------- */}

          <View
              style={{
                backgroundColor: palette.rankHighlight,
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
          >
            <Feather name="check-circle" size={24} color={palette.accent} style={{ marginRight: 10 }} />
            <View>
              <Text style={{ fontWeight: 'bold', color: palette.accent, fontSize: 16 }}>Ganhe +1 Ponto</Text>
              <Text style={{ color: palette.accent, fontSize: 12 }}>Faca check-in diario e suba no ranking.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleFinalizar} disabled={salvando}>
            <Text style={styles.buttonText}>{salvando ? 'Salvando...' : 'Finalizar Check-in'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de Escolher Foto mantido igual */}
        <Modal
            visible={menuFotoVisivel}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuFotoVisivel(false)}
        >
          <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setMenuFotoVisivel(false)}
          >
            <Pressable
                style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 20, width: '80%', maxWidth: 320 }}
                onPress={(e) => e.stopPropagation()}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: palette.text }}>Foto do treino</Text>
              <Text style={{ color: palette.textSecondary, marginBottom: 16 }}>Como voce quer adicionar a foto?</Text>

              <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                  onPress={() => escolherOpcao(tirarFoto)}
              >
                <Feather name="camera" size={22} color={palette.accent} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: palette.text }}>Tirar foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                  onPress={() => escolherOpcao(escolherDaGaleria)}
              >
                <Feather name="image" size={22} color={palette.accent} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: palette.text }}>Escolher da galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}
                  onPress={() => setMenuFotoVisivel(false)}
              >
                <Text style={{ color: palette.textMuted, fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
  );
}
