// Arquivo: MapWrapper.tsx (Esta é a versão que o Celular vai ler)
import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function MapWrapper({ latitude, longitude }: { latitude: number; longitude: number }) {
    return (
        <MapView
            style={{ width: '100%', height: '100%' }}
            initialRegion={{
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
        >
            <Marker coordinate={{ latitude, longitude }} />
        </MapView>
    );
}