import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';
import { salvarUsuarioSessao } from '../services/sessao';
import { styles } from './styles';

export default function Login() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleEntrar = async () => {
    if (!email.trim() || !senha) {
      Alert.alert('Atencao', 'Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha }),
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
        Alert.alert('Erro', String(msg || 'E-mail ou senha incorretos.'));
        return;
      }

      if (!dados || typeof dados !== 'object' || dados.erro || dados.error) {
        const msg = dados?.mensagem || dados?.message || 'E-mail ou senha incorretos.';
        Alert.alert('Erro', String(msg));
        return;
      }

      await salvarUsuarioSessao(dados);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home', params: { usuario: dados } }],
        })
      );
    } catch (e) {
      console.log(e);
      Alert.alert('Conexao', 'Nao foi possivel conectar. Verifique API_URL em src/config/api.ts.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 40 }}>🐭</Text>
        </View>
        <Text style={styles.title}>GymMouse</Text>
        <Text style={styles.subtitle}>Mantenha-se focado em seus exercicios</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={senha}
          onChangeText={(texto) => setSenha(texto.replace(/\s/g, ''))}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleEntrar} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.linkText}>Nao tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
