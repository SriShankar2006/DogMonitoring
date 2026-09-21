import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadSighting = async () => {
    if (!image) {
      Alert.alert('Please select an image');
      return;
    }

    try {
      setUploading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });
      formData.append('latitude', String(location.coords.latitude));
      formData.append('longitude', String(location.coords.longitude));
      formData.append('address', 'Mobile upload');
      formData.append('capturedAt', new Date().toISOString());

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Upload successful', JSON.stringify(response.data));
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload sighting</Text>
      {image ? <Image source={{ uri: image.uri }} style={styles.image} /> : <Text>No image selected</Text>}
      <View style={{ marginTop: 16 }}>
        <Button title="Pick image" onPress={pickImage} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title={uploading ? 'Uploading...' : 'Submit'} onPress={uploadSighting} disabled={uploading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  image: { width: '100%', height: 240, borderRadius: 12, marginBottom: 12 },
});
