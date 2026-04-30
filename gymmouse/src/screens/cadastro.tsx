import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { styles } from './styles';

export default function Cadastro() {
    const navigation = useNavigation<any>();
    const [nomecompleto, setNomeCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmasenha, setConfirmaSenha] = useState('');
    const [erroSenha, setErroSenha] = useState('');
    const [erroCadastro, setErroCadastro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const handleCadastro = async () => {
        if (!nomecompleto || !email || !senha || !confirmasenha) {
            const mensagem = 'Por favor, preencha todos os campos!';
            setErroCadastro(mensagem);
            Alert.alert('Atencao', mensagem);
            return;
        }

        if (senha !== confirmasenha) {
            setErroSenha('Senhas diferentes! As senhas precisam ser iguais!');
            setErroCadastro('');
            return;
        }

        setErroSenha('');
        setErroCadastro('');
        setCarregando(true);

        try {
            const urlDoServidor = `${API_URL}/api/usuarios`;

            const resposta = await fetch(urlDoServidor, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: nomecompleto.trim(),
                    email: email.trim(),
                    senha: senha,
                }),
            });

            const textoResposta = await resposta.text();
            let dadosDoUsuario = null;

            if (textoResposta) {
                try {
                    dadosDoUsuario = JSON.parse(textoResposta);
                } catch {
                    dadosDoUsuario = textoResposta;
                }
            }

            if (resposta.ok) {
                const idUsuario = typeof dadosDoUsuario === 'object' && dadosDoUsuario !== null ? dadosDoUsuario.id : '';
                Alert.alert('Sucesso!', `Conta criada! Bem-vindo ao GymMouse.\nSeu ID e: ${idUsuario}`);

                setNomeCompleto('');
                setEmail('');
                setSenha('');
                setConfirmaSenha('');
                navigation.goBack();
            } else {
                const mensagemServidor =
                    typeof dadosDoUsuario === 'object' && dadosDoUsuario !== null
                        ? dadosDoUsuario.mensagem || dadosDoUsuario.message || dadosDoUsuario.error
                        : dadosDoUsuario;
                const mensagem = mensagemServidor || `Servidor recusou o cadastro. Status: ${resposta.status}`;

                setErroCadastro(String(mensagem));
                Alert.alert('Erro', String(mensagem));
            }
        } catch (error) {
            const mensagem = 'Nao foi possivel conectar ao servidor. Confira se o Spring Boot esta rodando e se o IP esta correto.';
            setErroCadastro(mensagem);
            Alert.alert('Erro de Conexao', mensagem);
            console.log(error);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Text style={{ fontSize: 40 }}>ratinho</Text>
                </View>

                <Text style={styles.title}>GymMouse</Text>
                <Text style={styles.subtitle}>Mantenha-se focado em seus exercicios</Text>

                <Text style={styles.label}>Nome</Text>
                <TextInput
                    style={styles.input}
                    value={nomecompleto}
                    onChangeText={setNomeCompleto}
                    placeholder="Digite o seu nome completo"
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Digite o seu@email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Senha</Text>
                <TextInput
                    style={styles.input}
                    value={senha}
                    onChangeText={(texto) => setSenha(texto.replace(/\s/g, ''))}
                    placeholder="Digite sua senha"
                    secureTextEntry={true}
                />

                <Text style={styles.label}>Confirmar Senha</Text>
                <TextInput
                    style={styles.input}
                    value={confirmasenha}
                    onChangeText={(texto) => setConfirmaSenha(texto.replace(/\s/g, ''))}
                    placeholder="Confirme sua senha"
                    secureTextEntry={true}
                />

                {erroSenha !== '' && (
                    <Text style={styles.errorText}>
                        {erroSenha}
                    </Text>
                )}

                {erroCadastro !== '' && (
                    <Text style={styles.errorText}>
                        {erroCadastro}
                    </Text>
                )}

                <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={carregando}>
                    <Text style={styles.buttonText}>{carregando ? 'Criando...' : 'Criar Conta'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Ja esta cadastrado? Entre aqui</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
