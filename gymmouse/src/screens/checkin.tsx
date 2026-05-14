import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './styles';

// --- BANCO DE DADOS TEMPORÁRIO (Memória RAM) ---
// Exportamos para que a tela de Grupo consiga ler esses dados
export let POSTS_GLOBAIS: any[] = [];
export let PONTOS_GLOBAIS: Record<string, number> = {}; 

export default function Checkin() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params ?? {};
  const grupoId = params.id != null ? String(params.id) : 'geral';

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleFinalizar = () => {
    if (titulo.trim() === '') {
      Alert.alert("Erro", "Dê um título ao seu treino!");
      return;
    }

    // 1. Salva o post na lista global (vai aparecer na aba 'Check-ins Hoje')
    const novoPost = {
      id: Math.random().toString(),
      grupoId: grupoId, // Vincula o post a este grupo
      nome: 'Você',
      tempo: 'Agora mesmo',
      titulo: titulo,
      desc: descricao,
      likes: 0,
      comments: 0
    };
    
    POSTS_GLOBAIS.unshift(novoPost); // Adiciona no topo da lista

    // 2. Soma +1 ponto para você neste grupo específico
    const pontosAtuais = PONTOS_GLOBAIS[grupoId] || 0;
    PONTOS_GLOBAIS[grupoId] = pontosAtuais + 1;

    Alert.alert('Sucesso!', 'Check-in realizado! Você ganhou +1 Ponto.', [
      { 
        text: 'OK', 
        onPress: () => {
          setTitulo('');
          setDescricao('');
          navigation.goBack();
        } 
      }
    ]);
  };

  return (
    <View style={styles.homeContainer}>
      <View style={styles.checkinHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fazer Check-in</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <Text style={styles.label}>Foto do Treino</Text>
        <TouchableOpacity style={styles.photoBox}>
          <Feather name="camera" size={40} color="#999" />
          <Text style={styles.photoTextMain}>Toque para tirar uma foto</Text>
          <Text style={styles.photoTextSub}>ou selecionar da galeria</Text>
        </TouchableOpacity>

        <View style={styles.inputsCard}>
            <Text style={styles.label}>Título do Treino</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Treino de Pernas" 
              value={titulo} 
              onChangeText={setTitulo} 
            />
            
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="Como foi o treino? O que você fez?" 
              multiline={true} 
              value={descricao} 
              onChangeText={setDescricao} 
            />
        </View>

        <View style={styles.bannerBox}>
          <View style={styles.bannerIconBox}>
            <Feather name="check" size={16} color="#FFF" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.bannerTitle}>Ganhe +1 Ponto</Text>
            <Text style={styles.bannerSub}>Ao finalizar, sua pontuação subirá!</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleFinalizar}>
          <Text style={styles.buttonText}>Finalizar Check-in</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}