import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { styles } from './styles';


const GRUPOS_URL = `${API_URL}/api/grupos`;

export default function Home() {
    const navigation = useNavigation<any>();

    // Começa com uma lista vazia
    const [grupos, setGrupos] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [modalVisivel, setModalVisivel] = useState(false);
    const [acaoModal, setAcaoModal] = useState('menu');
    const [nomeGrupo, setNomeGrupo] = useState('');
    const [descricaoGrupo, setDescricaoGrupo] = useState('');

    // 1. CARREGAR OS GRUPOS DA API AO ABRIR A TELA (GET)
    useEffect(() => {
        carregarGrupos();
    }, []);

    const carregarGrupos = async () => {
        try {
            const response = await fetch(GRUPOS_URL);
            const data = await response.json();

            // Mapeia os dados do banco para o formato que a tela espera
            const gruposFormatados = data.map((grupo: any) => ({
                id: String(grupo.id),
                nome: grupo.nome,
                descricao: grupo.descricao,
                membros: 1, // <- Fictício (falta no backend)
                rank: 0,    // <- Fictício (falta no backend)
                pontos: 0   // <- Fictício (falta no backend)
            }));

            setGrupos(gruposFormatados);
        } catch (error) {
            console.error("Erro ao buscar grupos:", error);
            Alert.alert("Erro", "Não foi possível conectar ao servidor.");
        } finally {
            setCarregando(false);
        }
    };

    const abrirModal = () => {
        setAcaoModal('menu');
        setModalVisivel(true);
    };

    // 2. CRIAR UM GRUPO NA API (POST)
    const handleCriarGrupo = async () => {
        if (nomeGrupo.trim() === '') return;

        try {
            const response = await fetch(GRUPOS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: nomeGrupo,
                    descricao: descricaoGrupo,
                    // codigoAcesso: "..." (Você pode gerar um código aleatório aqui depois)
                }),
            });

            const grupoSalvo = await response.json(); // Pega a resposta do Spring Boot

            // Adiciona o grupo recém-criado na lista da tela
            const novoGrupoFormatado = {
                id: String(grupoSalvo.id),
                nome: grupoSalvo.nome,
                descricao: grupoSalvo.descricao,
                membros: 1,
                rank: 0,
                pontos: 0,
            };

            setGrupos([...grupos, novoGrupoFormatado]);

            // Limpa os campos e fecha
            setNomeGrupo('');
            setDescricaoGrupo('');
            setModalVisivel(false);
        } catch (error) {
            console.error("Erro ao criar grupo:", error);
            Alert.alert("Erro", "Não foi possível criar o grupo.");
        }
    };

    // OBS: Como sua API ainda não tem a rota DELETE, essa função só tira da tela por enquanto
    const handleSairGrupo = (idParaRemover: string) => {
        const novaLista = grupos.filter(grupo => grupo.id !== idParaRemover);
        setGrupos(novaLista);
    };

    const renderizarGrupo = ({ item }: any) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => navigation.navigate('Grupo', { grupo: item })}
        >
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

            {/* 3. Mostra um indicador de carregamento enquanto busca os dados */}
            {carregando ? (
                <ActivityIndicator size="large" color="#FF8C00" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={grupos}
                    keyExtractor={item => item.id}
                    renderItem={renderizarGrupo}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>
                            Você ainda não está em nenhum grupo.
                        </Text>
                    }
                />
            )}

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
