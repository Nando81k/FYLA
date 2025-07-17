import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { chatService } from '@/services/chatService';
import { Message, MessageType, MessageAttachment, CreateMessageRequest, MessageReaction } from '@/types/chat';
import { User } from '@/types';
import EnhancedMessageBubble from '@/components/chat/EnhancedMessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import EnhancedMessageInput from '@/components/chat/EnhancedMessageInput';

type ChatScreenRouteProp = RouteProp<{
  Chat: {
    conversationId: number;
    otherUser: User;
  };
}, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { 
    messages: contextMessages, 
    setMessages: setContextMessages,
    isConnected,
    typingUsers,
    onlineUsers,
    markConversationAsRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    loadMessages: loadMessagesFromContext,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    updateMessage,
    deliveryStatus
  } = useChatContext();
  
  // Safety check for route params
  const routeParams = route.params;
  if (!routeParams) {
    return (
      <View style={styles.container}>
        <Text>Invalid conversation</Text>
      </View>
    );
  }
  
  const { conversationId, otherUser } = routeParams;
  
  // Additional safety check for otherUser
  if (!otherUser || !otherUser.id) {
    return (
      <View style={styles.container}>
        <Text>Error: User information not available</Text>
      </View>
    );
  }
  
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get messages for this conversation from context
  const messages = contextMessages[conversationId] || [];
  const isOtherUserTyping = typingUsers.has(otherUser.id);

  useEffect(() => {
    loadMessages();
    joinConversation(conversationId);
    markConversationAsRead(conversationId);
    
    navigation.setOptions({
      title: otherUser?.fullName || 'Chat',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      },
    });

    return () => {
      leaveConversation(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, navigation, otherUser]);

  const loadMessages = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Use real data from ChatContext
      await loadMessagesFromContext(conversationId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string, messageType: MessageType = MessageType.TEXT, attachments?: MessageAttachment[]) => {
    if (!content.trim() || !token || !otherUser) return;

    try {
      await sendMessage(conversationId, content, messageType, attachments);
      setMessageText(''); // Clear the input after sending
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit message.');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message.');
    }
  };

  const handleReactToMessage = async (messageId: number, emoji: string) => {
    try {
      await reactToMessage(messageId, emoji);
    } catch (error) {
      Alert.alert('Error', 'Failed to add reaction.');
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isMyMessage = message.senderId === user?.id;
    
    return (
      <EnhancedMessageBubble
        message={message}
        isOwnMessage={isMyMessage}
        currentUser={user!}
        onReact={handleReactToMessage}
        deliveryStatus={deliveryStatus[message.id]}
        showDeliveryStatus={true}
        onLongPress={(msg) => {
          // Handle long press actions like edit/delete
          Alert.alert(
            'Message Options',
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              isMyMessage && { 
                text: 'Edit', 
                onPress: () => {
                  Alert.prompt(
                    'Edit Message',
                    'Enter new message:',
                    (text) => text && handleEditMessage(msg.id, text),
                    'plain-text',
                    msg.content
                  );
                }
              },
              isMyMessage && { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Delete Message',
                    'Are you sure you want to delete this message?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(msg.id) }
                    ]
                  );
                }
              },
            ].filter(Boolean) as any[]
          );
        }}
      />
    );
  };

  const renderHeader = () => {
    const isOtherUserOnline = onlineUsers.has(otherUser?.id || 0);
    // Remove the line that was causing the error
    
    return (
      <View style={styles.chatHeader}>
        <Image
          source={{
            uri: otherUser?.profilePictureUrl || 'https://via.placeholder.com/40x40?text=?',
          }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.fullName}</Text>
          <Text style={styles.headerStatus}>
            {isOtherUserTyping 
              ? 'Typing...' 
              : isOtherUserOnline 
                ? 'Active now' 
                : 'Last seen recently'
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[
            styles.connectionIndicator,
            { backgroundColor: isConnected ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.connectionText}>
              {isConnected ? '●' : '○'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderHeader()}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {isOtherUserTyping && (
          <TypingIndicator 
            userName={otherUser.fullName}
            isVisible={isOtherUserTyping}
          />
        )}

        <EnhancedMessageInput
          value={messageText}
          onChangeText={setMessageText}
          onSend={handleSendMessage}
          onTyping={(isTyping) => sendTyping(conversationId, isTyping)}
          placeholder="Type a message..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerActions: {
    marginLeft: 'auto',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 8,
    color: 'white',
  },
});

export default ChatScreen;
