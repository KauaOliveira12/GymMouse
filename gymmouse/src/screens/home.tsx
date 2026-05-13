import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { styles } from './styles';

const GRUPOS_URL = `${API_URL}/api/grupos`;

const formatarGrupo = (grupo: any) => ({
    id: String(grupo.id),
    nome: grupo.nome,
    descricao: grupo.descricao || '',
    membros: grupo.membros || 1,
    rank: grupo.rank || 0,
    pontos: grupo.pontos || 0,
});

const lerResposta = async (resposta: Response) => {
    const textoResposta = await resposta.text();

    if (!textoResposta) {
        return null;
    }

    try {
        return JSON.parse(textoResposta);
    } catch {
        return textoResposta;
    }
};

const fetchComTimeout = async (url: string, options?: RequestInit, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
};

export default function Home() {
    const navigation = useNavigation<any>();

    const [grupos, setGrupos] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [modalVisivel, setModalVisivel] = useState(false);
    const [acaoModal, setAcaoModal] = useState('menu');

    const [nomeGrupo, setNomeGrupo] = useState('');
    const [descricaoGrupo, setDescricaoGrupo] = useState('');
    const [erroGrupo, setErroGrupo] = useState('');

    const carregarGrupos = useCallback(async () => {
        setCarregando(true);

        try {
            const resposta = await fetchComTimeout(GRUPOS_URL);
            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                const mensagemServidor =
                    typeof dados === 'object' && dados !== null
                        ? dados.mensagem || dados.message || dados.error
                        : dados;
                const mensagem = mensagemServidor || `Erro ao buscar grupos. Status: ${resposta.status}`;

                Alert.alert('Erro', String(mensagem));
                return;
            }

            const lista = Array.isArray(dados) ? dados : [];
            setGrupos(lista.map(formatarGrupo));
        } catch (error) {
            Alert.alert('Erro de Conexao', 'Nao foi possivel conectar ao servidor para carregar os grupos.');
            console.log(error);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarGrupos();
    }, [carregarGrupos]);

    const abrirModal = () => {
        setAcaoModal('menu');
        setModalVisivel(true);
    };

    const handleCriarGrupo = async () => {
        if (nomeGrupo.trim() === '') {
            const mensagem = 'Digite o nome do grupo.';
            setErroGrupo(mensagem);
            Alert.alert('Atencao', mensagem);
            return;
        }

        setErroGrupo('');
        setSalvando(true);

        try {
            const resposta = await fetchComTimeout(GRUPOS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: nomeGrupo.trim(),
                    descricao: descricaoGrupo.trim(),
                }),
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                const mensagemServidor =
                    typeof dados === 'object' && dados !== null
                        ? dados.mensagem || dados.message || dados.error
                        : dados;
                const mensagem = mensagemServidor || `Servidor recusou o grupo. Status: ${resposta.status}`;

                setErroGrupo(String(mensagem));
                Alert.alert('Erro', String(mensagem));
                return;
            }

            if (!dados || typeof dados !== 'object') {
                await carregarGrupos();
            } else {
                setGrupos((listaAtual) => [...listaAtual, formatarGrupo(dados)]);
            }

            setNomeGrupo('');
            setDescricaoGrupo('');
            setModalVisivel(false);
        } catch (error) {
            const mensagem = 'Nao foi possivel criar o grupo. Confira se o Spring Boot esta rodando e se o IP esta correto.';
            setErroGrupo(mensagem);
            Alert.alert('Erro de Conexao', mensagem);
            console.log(error);
        } finally {
            setSalvando(false);
        }
    };

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
                    <Text style={styles.groupCardText}>Membros: {item.membros}</Text>
                </View>
                <View style={styles.groupCardRow}>
                    <Text style={[styles.groupCardText, { color: '#FF8C00', fontWeight: 'bold' }]}>
                        Rank #{item.rank} - {item.pontos} pts
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
                        <Text style={{ fontSize: 18 }}>GM</Text>
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
                            Voce ainda nao esta em nenhum grupo.
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
                                    <Text style={styles.modalTitle}>Escolha uma acao</Text>
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

                                <Text style={styles.label}>Descricao</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Descricao do grupo"
                                    value={descricaoGrupo}
                                    onChangeText={setDescricaoGrupo}
                                />

                                {erroGrupo !== '' && (
                                    <Text style={styles.errorText}>
                                        {erroGrupo}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleCriarGrupo}
                                    disabled={salvando}
                                >
                                    <Text style={styles.buttonText}>{salvando ? 'Criando...' : 'Criar Grupo'}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                    </View>
                </View>
            </Modal>

        </View>
    );
}
