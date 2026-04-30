import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';

// Dados simulados baseados no protótipo de alta fidelidade
const MOCK_CHECKINS = [
  { id: '1', nome: 'Carlos Silva', tempo: 'Há 2 horas', titulo: 'Treino de Peito e Tríceps', desc: 'Sessão intensa hoje! 💪 Supino reto, inclinado e paralelas.', likes: 12, comments: 3 },
  { id: '2', nome: 'Ana Paula', tempo: 'Há 5 horas', titulo: 'Cardio Concluído', desc: '10km na esteira para começar o dia.', likes: 8, comments: 1 },
];

const MOCK_RANKING = [
  { id: '1', pos: '1', nome: 'Carlos Silva', pontos: 7, destaque: false },
  { id: '2', pos: '2', nome: 'Ana Paula', pontos: 7, destaque: false },
  { id: '3', pos: '3', nome: 'Você', pontos: 6, destaque: true }, // Destaque laranja no protótipo
  { id: '4', pos: '4', nome: 'Pedro Santos', pontos: 5, destaque: false },
];

export default function Grupo() {
  const navigation = useNavigation<any>();
  // Estado que controla se estamos na aba de "checkins" ou "ranking"
  const [abaAtiva, setAbaAtiva] = useState('checkins');

  // Desenha um post de foto
  const renderCheckin = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.nome.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={{ fontWeight: 'bold', color: '#0B2046' }}>{item.nome}</Text>
          <Text style={{ color: '#999', fontSize: 12 }}>{item.tempo}</Text>
        </View>
      </View>
      
      {/* Placeholder simulando a foto do check-in */}
      <View style={styles.postImagePlaceholder} />
      
      <Text style={styles.postTitle}>{item.titulo}</Text>
      <Text style={styles.postDesc}>{item.desc}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="heart" size={18} color="#666" style={{ marginRight: 5 }} />
          <Text style={{ color: '#666' }}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="message-square" size={18} color="#666" style={{ marginRight: 5 }} />
          <Text style={{ color: '#666' }}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Desenha uma linha do ranking
  const renderRanking = ({ item }: any) => (
    <View style={[styles.rankCard, item.destaque && styles.rankCardDestaque]}>
      <Text style={styles.rankPos}>{item.pos}</Text>
      <View style={[styles.postAvatar, { backgroundColor: item.destaque ? '#FF8C00' : '#E0E0E0' }]}>
         <Text style={{ color: item.destaque ? '#FFF' : '#333', fontWeight: 'bold' }}>
           {item.nome.substring(0, 2).toUpperCase()}
         </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', color: item.destaque ? '#FF8C00' : '#0B2046', fontSize: 16 }}>{item.nome}</Text>
        <Text style={{ color: '#666' }}>{item.pontos} pontos</Text>
      </View>
      {item.destaque && (
        <View style={{ backgroundColor: '#FF8C00', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 }}>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Você</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.homeContainer}>
      {/* Header Superior */}
      <View style={styles.grupoHeaderTop}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.grupoHeaderTitle}>Guerreiros da Academia</Text>
      </View>

      {/* Capa do Grupo com informações */}
      <View style={styles.grupoCover}>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <Text style={styles.grupoCoverText}>👥 24 membros</Text>
          <Text style={styles.grupoCoverText}>📅 Desde Janeiro 2026</Text>
        </View>
      </View>

      {/* Sistema de Abas (Check-ins x Ranking) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, abaAtiva === 'checkins' && styles.tabActive]}
          onPress={() => setAbaAtiva('checkins')}
        >
          <Text style={[styles.tabText, abaAtiva === 'checkins' && styles.tabTextActive]}>Check-ins Hoje</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, abaAtiva === 'ranking' && styles.tabActive]}
          onPress={() => setAbaAtiva('ranking')}
        >
          <Text style={[styles.tabText, abaAtiva === 'ranking' && styles.tabTextActive]}>📉 Ranking</Text>
        </TouchableOpacity>
      </View>

      {/* Renderização Condicional: Mostra a lista dependendo de qual aba está selecionada */}
      {abaAtiva === 'checkins' ? (
        <FlatList
          data={MOCK_CHECKINS}
          keyExtractor={item => item.id}
          renderItem={renderCheckin}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      ) : (
        <FlatList
          data={MOCK_RANKING}
          keyExtractor={item => item.id}
          renderItem={renderRanking}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
        />
      )}
    </View>
  );
}
