import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { UserRole } from '@/types';

interface RoleSelectionScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onRoleSelect }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to FYLA</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
        
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, styles.clientCard]}
            onPress={() => onRoleSelect(UserRole.CLIENT)}
          >
            <Text style={styles.roleEmoji}>🔍</Text>
            <Text style={styles.roleTitle}>I'm a Client</Text>
            <Text style={styles.roleDescription}>
              Find and book services from local artists and professionals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.providerCard]}
            onPress={() => onRoleSelect(UserRole.PROVIDER)}
          >
            <Text style={styles.roleEmoji}>✨</Text>
            <Text style={styles.roleTitle}>I'm a Service Provider</Text>
            <Text style={styles.roleDescription}>
              Showcase your work and connect with clients in your area
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clientCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  providerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  roleEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});

export default RoleSelectionScreen;
