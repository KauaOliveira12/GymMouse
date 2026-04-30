import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { styles } from './styles';

export default function Login() {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erroLogin, setErroLogin] = useState('');

    const handleLogin = async () => {
        if (!email || !senha) {
            const mensagem = 'Preencha o e-mail e a senha.';
            setErroLogin(mensagem);
            Alert.alert('Atencao', mensagem);
            return;
        }

        setErroLogin('');

        try {
            const urlDoServidor = `${API_URL}/api/usuarios/login`;

            const resposta = await fetch(urlDoServidor, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    senha: senha,
                }),
            });

            if (!resposta.ok) {
                const mensagem = 'E-mail ou senha incorretos.';
                setErroLogin(mensagem);
                Alert.alert('Erro', mensagem);
                return;
            }

            const textoResposta = await resposta.text();
            const dadosDoUsuario = textoResposta ? JSON.parse(textoResposta) : null;

            if (!dadosDoUsuario || dadosDoUsuario.erro || dadosDoUsuario.error) {
                const mensagem = dadosDoUsuario?.mensagem || dadosDoUsuario?.message || 'E-mail ou senha incorretos.';
                setErroLogin(mensagem);
                Alert.alert('Erro', mensagem);
                return;
            }

            Alert.alert('Sucesso', `Bem-vindo de volta, ${dadosDoUsuario.nome || 'usuario'}!`);
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                })
            );
        } catch (error) {
            const mensagem = 'Nao foi possivel conectar na API. No PC, confira CORS no Spring Boot e se a API esta em localhost:8080.';
            setErroLogin(mensagem);
            Alert.alert('Erro de Rede', mensagem);
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Text style={{ fontSize: 40 }}>ratinho</Text>
                </View>

                <Text style={styles.title}>GymMouse</Text>
                <Text style={styles.subtitle}>Mantenha-se focado em seus exercicios</Text>

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
                    onChangeText={setSenha}
                    placeholder="Digite sua senha"
                    secureTextEntry={true}
                />

                {erroLogin !== '' && (
                    <Text style={styles.errorText}>
                        {erroLogin}
                    </Text>
                )}

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginTop: 20, alignItems: 'center' }}
                    onPress={() => navigation.navigate('Cadastro')}
                >
                    <Text style={styles.linkText}>
                        Nao tem conta? Cadastre-se agora!
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
