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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthStackParamList, UserRole } from '../../types';

type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

const RegisterScreen: React.FC = () => {
  const route = useRoute<RouteProp<AuthStackParamList, 'Register'>>();
  const userType = route.params?.userType || UserRole.CLIENT;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();

  const isProvider = userType === UserRole.PROVIDER;

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Registration Failed', 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Registration Failed', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Registration Failed', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        confirmPassword,
        phoneNumber: phone.trim(),
        role: userType,
      });
      // On success, you might want to navigate to a confirmation screen or back to login
      Alert.alert('Success', 'Your account has been created successfully. Please sign in.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Registration Failed', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = isProvider ? 'Become a Provider' : 'Create an Account';
  const subtitle = isProvider ? 'Share your expertise with local clients' : 'Discover amazing local services';
  const buttonTitle = isProvider ? 'Start Providing Services' : 'Create Account';
  const primaryColor = isProvider ? '#D4AF37' : colors.primary;

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Ionicons name={isProvider ? "briefcase" : "person"} size={40} color={primaryColor} />
                <Text style={[styles.title, { color: colors.text.primary, fontWeight: 'bold' }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
              </View>

              {/* Form */}
              <View style={[
                styles.formContainer,
                {
                  backgroundColor: isDark ? 'rgba(42, 42, 46, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 229, 231, 0.5)',
                }
              ]}>
                <View style={styles.row}>
                  <TextInput style={[styles.input, styles.halfWidth, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="First Name" placeholderTextColor={colors.text.secondary} value={firstName} onChangeText={setFirstName} />
                  <TextInput style={[styles.input, styles.halfWidth, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="Last Name" placeholderTextColor={colors.text.secondary} value={lastName} onChangeText={setLastName} />
                </View>
                <TextInput style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="Email" placeholderTextColor={colors.text.secondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="Phone Number" placeholderTextColor={colors.text.secondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                
                <TextInput style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="Password" placeholderTextColor={colors.text.secondary} value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.light }]} placeholder="Confirm Password" placeholderTextColor={colors.text.secondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                <TouchableOpacity
                  style={[styles.registerButton, { backgroundColor: primaryColor }]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color={colors.text.inverse} />
                    : <Text style={[styles.registerButtonText, { color: colors.text.inverse, fontWeight: '600' }]}>{buttonTitle}</Text>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                <Text style={[styles.loginLinkText, { color: colors.text.secondary }]}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  backButton: { position: 'absolute', top: 0, left: 0, padding: 8 },
  title: { fontSize: 28, marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  formContainer: { width: '100%', borderRadius: 20, padding: 20, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { fontSize: 16, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 20 },
  halfWidth: { width: '48%' },
  textArea: { height: 80, textAlignVertical: 'top' },
  registerButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  registerButtonText: { fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginLinkText: { fontSize: 14 },
});

export default RegisterScreen;
