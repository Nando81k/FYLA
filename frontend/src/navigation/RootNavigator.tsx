import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import AuthNavigator from './AuthNavigator';
import ClientNavigator from './ClientNavigator';
import ProviderNavigator from './ProviderNavigator';
import { UserRole, RootStackParamList } from '@/types';
import LoadingScreen from '@/screens/shared/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Debug logging to help troubleshoot authentication issues
  console.log('RootNavigator Debug:', {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    userRoleType: typeof user?.role,
    userEmail: user?.email,
    expectedClientRole: UserRole.CLIENT,
    expectedProviderRole: UserRole.PROVIDER,
    roleComparison: {
      isClient: user?.role === UserRole.CLIENT,
      isProvider: user?.role === UserRole.PROVIDER,
      match: user?.role === UserRole.CLIENT ? 'CLIENT' : user?.role === UserRole.PROVIDER ? 'PROVIDER' : 'NO_MATCH'
    }
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === UserRole.CLIENT ? (
        <Stack.Screen name="Main" component={ClientNavigator} />
      ) : (
        <Stack.Screen name="Main" component={ProviderNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
