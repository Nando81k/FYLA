import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, UserRole } from '@/types';
import RoleSelectionScreen from '@/screens/auth/RoleSelectionScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const resetToRoleSelection = () => {
    setSelectedRole(null);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {selectedRole === null ? (
        <>
          <Stack.Screen name="RoleSelection">
            {() => <RoleSelectionScreen onRoleSelect={handleRoleSelect} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onNavigateToRegister={() => navigation.navigate('Register')}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <>
          <Stack.Screen name="Register">
            {({ navigation }) => (
              <RegisterScreen
                selectedRole={selectedRole}
                onNavigateToLogin={() => navigation.navigate('Login')}
                onBack={resetToRoleSelection}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onNavigateToRegister={() => navigation.navigate('Register')}
              />
            )}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
