import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { API_CONFIG } from '@/config/api';

const ConnectivityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testBackendConnectivity = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Health check
      addResult('🔍 Testing health endpoint...');
      const healthResponse = await fetch(`${API_CONFIG.baseURL}/health`);
      const healthData = await healthResponse.json();
      addResult(`✅ Health check: ${healthData.status} (${healthData.environment})`);

      // Test 2: Login
      addResult('🔍 Testing login...');
      const loginResponse = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emma.johnson@email.com',
          password: 'TempPassword123!'
        }),
      });
      
      const loginData = await loginResponse.json();
      if (loginData.user) {
        addResult(`✅ Login successful: ${loginData.user.fullName} (${loginData.user.role})`);
        
        // Test 3: Appointments
        addResult('🔍 Testing appointments endpoint...');
        const appointmentsResponse = await fetch(`${API_CONFIG.baseURL}/appointments`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        const appointmentsData = await appointmentsResponse.json();
        addResult(`✅ Appointments loaded: ${appointmentsData.appointments?.length || 0} appointments`);
        
        addResult('🎉 All connectivity tests passed!');
      } else {
        addResult(`❌ Login failed: ${loginData.message}`);
      }
      
    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Backend Connectivity Test</Text>
      <Text style={styles.subtitle}>API Base URL: {API_CONFIG.baseURL}</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testBackendConnectivity}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Backend Connection'}
        </Text>
      </TouchableOpacity>

      <View style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8b5cf6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  results: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    minHeight: 200,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default ConnectivityTest;
