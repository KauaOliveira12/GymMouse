import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { styles } from './styles';

export default function Home() {
  const navigation = useNavigation<any>();
  // 1. Transformamos a lista fixa em um ESTADO para que a tela atualize ao adicionar novos grupos
  const [grupos, setGrupos] = useState([
    { id: '1', nome: 'Guarulhos FIT WARRIORS', membros: 24, rank: 3, pontos: 156 },
  ]);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [acaoModal, setAcaoModal] = useState('menu');

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');

  const abrirModal = () => {
    setAcaoModal('menu');
    setModalVisivel(true);
  };

  // 2. Função que cria o grupo novo e junta com os grupos antigos
  const handleCriarGrupo = () => {
    // Evita criar um grupo se o nome estiver vazio
    if (nomeGrupo.trim() === '') return; 

    // Cria o objeto do novo grupo com os dados base
    const novoGrupo = {
      id: String(new Date().getTime()), // Gera um ID único provisório
      nome: nomeGrupo,
      membros: 1, // Começa com 1 membro (você, como administrador)
      rank: 0, // Sem rank inicial
      pontos: 0, // Começa com 0 pontos
    };

    // Atualiza a lista na tela (pega tudo que já tinha e adiciona o novo no final)
    setGrupos([...grupos, novoGrupo]);

    // Limpa o formulário e fecha o modal
    setNomeGrupo('');
    setDescricaoGrupo('');
    setModalVisivel(false);
  };

    // Função para sair do grupo
  const handleSairGrupo = (idParaRemover: string) => {
    // Cria uma nova lista mantendo apenas os grupos que NÃO têm o ID escolhido
    const novaLista = grupos.filter(grupo => grupo.id !== idParaRemover);
    // Atualiza a tela com a nova lista
    setGrupos(novaLista);
  };

  const renderizarGrupo = ({ item }: any) => (
    <TouchableOpacity style={styles.groupCard} onPress={() => navigation.navigate('Grupo')}>
      <View style={[styles.groupCardImage, { backgroundColor: '#CCC' }]} />
      
      <View style={styles.groupCardInfo}>
        <Text style={styles.groupCardTitle}>{item.nome}</Text>
        <View style={styles.groupCardRow}>
          <Text style={styles.groupCardText}>👥 {item.membros} membros</Text>
        </View>
        <View style={styles.groupCardRow}>
          <Text style={[styles.groupCardText, { color: '#FF8C00', fontWeight: 'bold' }]}>
            🏆 Rank #{item.rank} • {item.pontos} pts
          </Text>
        </View>
      </View>

      {/* NOVO BOTÃO DE SAIR DO GRUPO */}
      <TouchableOpacity 
        style={styles.btnSair} 
        onPress={() => handleSairGrupo(item.id)}
      >
        <Feather name="log-out" size={24} color="#FF3B30" />
      </TouchableOpacity>
      
    </TouchableOpacity>
  );
  return (
    <View style={styles.homeContainer}>
      
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoCircle}>
             <Text style={{ fontSize: 18 }}>🐭</Text>
          </View>
          <Text style={styles.headerTitle}>GymMouse</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity><Feather name="moon" size={24} color="#FFF" style={styles.icon} /></TouchableOpacity>
          <TouchableOpacity><Feather name="user" size={24} color="#FFF" style={styles.icon} /></TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              )
            }
          >
            <Feather name="log-out" size={24} color="#FFF" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.pageTitle}>Meus Grupos</Text>

      {/* 3. A FlatList agora puxa a lista dinâmica 'grupos' */}
      <FlatList
        data={grupos}
        keyExtractor={item => item.id}
        renderItem={renderizarGrupo}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={abrirModal}>
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal transparent visible={modalVisivel} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            {acaoModal === 'menu' && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Escolha uma ação</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisivel(false)}>
                    <Feather name="x" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.modalActionBtn} onPress={() => setAcaoModal('criar_grupo')}>
                  <Feather name="users" size={20} color="#0B2046" style={styles.modalActionIcon} />
                  <Text style={styles.modalActionText}>Criar Novo Grupo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalActionBtn}>
                  <Feather name="plus" size={20} color="#0B2046" style={styles.modalActionIcon} />
                  <Text style={styles.modalActionText}>Participar de um Grupo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalActionBtn}>
                  <Feather name="camera" size={20} color="#0B2046" style={styles.modalActionIcon} />
                  <Text style={styles.modalActionText}>Fazer Check-in</Text>
                </TouchableOpacity>
              </>
            )}

            {acaoModal === 'criar_grupo' && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Criar Novo Grupo</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisivel(false)}>
                    <Feather name="x" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Nome do Grupo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Guerreiros da Academia"
                  value={nomeGrupo}
                  onChangeText={setNomeGrupo}
                />

                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Descrição do grupo"
                  value={descricaoGrupo}
                  onChangeText={setDescricaoGrupo}
                />

                {/* 4. O botão agora chama a nova função handleCriarGrupo */}
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleCriarGrupo}
                >
                  <Text style={styles.buttonText}>Criar Grupo</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}
