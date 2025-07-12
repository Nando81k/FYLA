import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FYLA</Text>
      <ActivityIndicator size="large" color="#3b82f6" style={styles.spinner} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingScreen;
