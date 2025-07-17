import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { NotificationProvider } from './src/context/NotificationContext';
import { ChatProvider } from './src/context/ChatContext';
import ClientNavigator from './src/navigation/ClientNavigator';
import ProviderNavigator from './src/navigation/ProviderNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/shared/LoadingScreen';
import { UserRole } from './src/types';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization time to prevent screen flicker
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show a loading screen while the app initializes or auth state is being checked
  if (!isAppReady || isLoading) {
    return <LoadingScreen />;
  }

  // If the user is authenticated, direct them to the correct navigator
  if (isAuthenticated && user) {
    return user.role === UserRole.PROVIDER ? <ProviderNavigator /> : <ClientNavigator />;
  }
  
  // Otherwise, always show the authentication flow
  return <AuthNavigator />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <NotificationProvider>
            <ChatProvider>
              <AppContent />
            </ChatProvider>
          </NotificationProvider>
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
