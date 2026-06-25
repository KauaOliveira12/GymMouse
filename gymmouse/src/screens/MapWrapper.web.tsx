// Arquivo: MapWrapper.web.tsx (Esta é a versão que o Navegador Web vai ler)
import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MapWrapper({ latitude, longitude }: { latitude: number; longitude: number }) {
    return (
        <View style={{ width: '100%', height: '100%', backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="map" size={32} color="#999" />
            <Text style={{ color: '#999', marginTop: 8 }}>Mapa visível apenas no App Mobile</Text>
        </View>
    );
}
