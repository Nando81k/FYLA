import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useChatContext } from '@/context/ChatContext';
import { chatService } from '@/services/chatService';
import { Conversation, User, UserRole } from '@/types';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

type MessagesNavigationProp = StackNavigationProp<any, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const { token, user } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const { 
    conversations, 
    isConnected, 
    unreadCounts, 
    onlineUsers,
    loadConversations: loadConversationsFromContext,
    setConversations 
  } = useChatContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [token])
  );

  const loadConversations = async (showLoader = true) => {
    if (!token) return;
    
    if (showLoader) setIsLoading(true);
    try {
      // Use real data from ChatContext
      await loadConversationsFromContext();
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Determine who is the other user in this conversation
    let otherUser: User | undefined;
    
    if (user?.id === conversation.clientId) {
      // Current user is the client, so other user is the provider
      otherUser = conversation.provider;
    } else if (user?.id === conversation.providerId) {
      // Current user is the provider, so other user is the client  
      otherUser = conversation.client;
    }

    // If we don't have the full user object, create a minimal one
    if (!otherUser) {
      const otherUserId = user?.id === conversation.clientId ? conversation.providerId : conversation.clientId;
      const otherUserRole = user?.id === conversation.clientId ? UserRole.PROVIDER : UserRole.CLIENT;
      
      otherUser = {
        id: otherUserId,
        role: otherUserRole,
        fullName: otherUserRole === UserRole.PROVIDER ? 'Provider' : 'Client',
        email: '',
        phoneNumber: '',
        createdAt: '',
        updatedAt: '',
      };
    }

    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: otherUser,
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const renderConversationItem = ({ item: conversation }: { item: Conversation }) => {
    // Determine who is the other user in this conversation
    let otherUser: User | undefined;
    
    if (user?.id === conversation.clientId) {
      // Current user is the client, so other user is the provider
      otherUser = conversation.provider;
    } else if (user?.id === conversation.providerId) {
      // Current user is the provider, so other user is the client  
      otherUser = conversation.client;
    }

    // If we don't have the full user object, create a minimal one
    if (!otherUser) {
      const otherUserId = user?.id === conversation.clientId ? conversation.providerId : conversation.clientId;
      const otherUserRole = user?.id === conversation.clientId ? UserRole.PROVIDER : UserRole.CLIENT;
      
      otherUser = {
        id: otherUserId,
        role: otherUserRole,
        fullName: otherUserRole === UserRole.PROVIDER ? 'Provider' : 'Client',
        email: '',
        phoneNumber: '',
        createdAt: '',
        updatedAt: '',
      };
    }

    const hasUnread = conversation.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(conversation)}
      >
        <Image
          source={{
            uri: otherUser?.profilePictureUrl || 'https://via.placeholder.com/50x50?text=?',
          }}
          style={styles.avatar}
        />
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadText]}>
              {otherUser?.fullName || 'Unknown User'}
            </Text>
            <Text style={[styles.timeText, hasUnread && styles.unreadText]}>
              {conversation.lastMessage && formatTime(conversation.lastMessage.sentAt)}
            </Text>
          </View>
          
          <View style={styles.lastMessageRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {conversation.lastMessage?.content || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start a conversation with a service provider to see your messages here
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Messages</Text>
          <DarkModeToggle size={24} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Messages</Text>
        <DarkModeToggle size={24} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          conversations.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MessagesScreen;
