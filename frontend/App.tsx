import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { BookingProvider } from './src/context/BookingContext';
import { TimeSlotProvider } from './src/context/TimeSlotContext';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <NotificationProvider>
              <BookingProvider>
                <TimeSlotProvider>
                  <ChatProvider>
                    <RootNavigator />
                  </ChatProvider>
                </TimeSlotProvider>
              </BookingProvider>
            </NotificationProvider>
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
