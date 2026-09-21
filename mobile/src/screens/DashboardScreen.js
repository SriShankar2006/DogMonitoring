import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>{stats ? JSON.stringify(stats) : 'Loading stats...'}</Text>
      <View style={{ marginTop: 16 }}>
        <Button title="Upload Sighting" onPress={() => navigation.navigate('Upload')} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title="Map" onPress={() => navigation.navigate('Map')} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title="Stats" onPress={() => navigation.navigate('Stats')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
});
