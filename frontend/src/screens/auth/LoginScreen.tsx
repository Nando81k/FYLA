import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthStackParamList, UserRole } from '../../types';

type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

const { width } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Sign In Failed', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      Alert.alert('Sign In Failed', 'The email or password you entered is incorrect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = (userType: UserRole) => {
    navigation.navigate('Register', { userType });
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (error) {
      Alert.alert('Quick Login Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text.primary, fontWeight: 'bold' }]}>Welcome to FYLA</Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary, fontWeight: 'normal' }]}>Find Your Local Artisan</Text>
            </View>

            {/* Form */}
            <View style={[
              styles.formContainer,
              {
                backgroundColor: isDark ? 'rgba(42, 42, 46, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 229, 231, 0.5)',
              }
            ]}>
              <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
                <Ionicons name="mail-outline" size={22} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Email"
                  placeholderTextColor={colors.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputContainer, { borderBottomColor: colors.border.light }]}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Password"
                  placeholderTextColor={colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={colors.text.inverse} />
                  : <Text style={[styles.loginButtonText, { color: colors.text.inverse, fontWeight: '600' }]}>Sign In</Text>}
              </TouchableOpacity>
            </View>

            {/* Sign Up Section */}
            <View style={styles.signupSection}>
              <Text style={[styles.signupText, { color: colors.text.secondary }]}>Don't have an account?</Text>
              <View style={styles.signupButtonContainer}>
                <TouchableOpacity
                  style={[styles.signupButton, { borderColor: colors.primary }]}
                  onPress={() => navigateToRegister(UserRole.CLIENT)}
                >
                  <Text style={[styles.signupButtonText, { color: colors.primary }]}>Sign Up as Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signupButton, { borderColor: colors.primary }]}
                  onPress={() => navigateToRegister(UserRole.PROVIDER)}
                >
                  <Text style={[styles.signupButtonText, { color: colors.primary }]}>Become a Provider</Text>
                </TouchableOpacity>
              </View>
              
              {/* Quick Login Section for Development */}
              <View style={styles.quickLoginSection}>
                <Text style={[styles.quickLoginText, { color: colors.text.secondary }]}>Quick Login (Testing)</Text>
                <View style={styles.quickLoginButtonContainer}>
                  <TouchableOpacity
                    style={[styles.quickLoginButton, { backgroundColor: colors.accent }]}
                    onPress={() => handleQuickLogin('emma.johnson@email.com', 'TempPassword123!')}
                    disabled={isLoading}
                  >
                    <Text style={[styles.quickLoginButtonText, { color: colors.text.inverse }]}>Demo Client</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickLoginButton, { backgroundColor: '#D4AF37' }]}
                    onPress={() => handleQuickLogin('sophia.grace@fylapro.com', 'TempPassword123!')}
                    disabled={isLoading}
                  >
                    <Text style={[styles.quickLoginButtonText, { color: colors.text.inverse }]}>Demo Provider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    fontSize: 16,
  },
  signupSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  signupText: {
    marginBottom: 16,
    fontSize: 14,
  },
  signupButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  signupButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    width: (width - 68) / 2,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickLoginSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  quickLoginText: {
    marginBottom: 12,
    fontSize: 12,
    opacity: 0.7,
  },
  quickLoginButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickLoginButton: {
    borderRadius: 8,
    paddingVertical: 8,
    width: (width - 68) / 2,
    alignItems: 'center',
  },
  quickLoginButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LoginScreen;
