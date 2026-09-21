import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dog map</Text>
      <MapView style={styles.map} initialRegion={{ latitude: 11.0168, longitude: 76.9558, latitudeDelta: 0.1, longitudeDelta: 0.1 }}>
        <Marker coordinate={{ latitude: 11.0168, longitude: 76.9558 }} title="Sample dog" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  map: { flex: 1, borderRadius: 12 },
});
