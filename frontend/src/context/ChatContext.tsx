import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Message, Conversation, ConversationListResponse, CreateMessageRequest, MessageType, TypingIndicator, OnlineStatus, MessageAttachment } from '@/types/chat';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';

interface ChatContextType {
  conversations: Conversation[];
  messages: { [conversationId: number]: Message[] };
  activeConversation: number | null;
  isConnected: boolean;
  unreadCounts: { [conversationId: number]: number };
  onlineUsers: Set<number>;
  typingUsers: Set<number>;
  deliveryStatus: { [messageId: number]: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' };
  setActiveConversation: (conversationId: number | null) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  sendMessage: (conversationId: number, content: string, messageType?: MessageType, attachments?: MessageAttachment[]) => Promise<void>;
  sendTyping: (conversationId: number, isTyping: boolean) => void;
  markAsRead: (conversationId: number) => Promise<void>;
  markConversationAsRead: (conversationId: number) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  setMessages: (conversationId: number, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  deleteMessage: (messageId: number) => void;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  reactToMessage: (messageId: number, emoji: string) => Promise<void>;
  editMessage: (messageId: number, newContent: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessagesState] = useState<{ [conversationId: number]: Message[] }>({});
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [conversationId: number]: number }>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [deliveryStatus, setDeliveryStatus] = useState<{ [messageId: number]: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' }>({});
  const typingTimeoutRef = useRef<{ [conversationId: number]: NodeJS.Timeout }>({});

  // For now, we'll use the REST API only since SignalR integration needs to be set up properly
  useEffect(() => {
    if (token && user) {
      setIsConnected(true); // Mock connection status
    } else {
      setIsConnected(false);
    }
  }, [token, user]);

  const loadConversations = async () => {
    try {
      if (!token) return;
      
      // Use feature flag-aware method that can switch between mock and real API
      const response = await chatService.getConversations(token);
      
      setConversations(response.conversations || []);
      
      // Calculate unread counts
      const unreadMap: { [key: number]: number } = {};
      (response.conversations || []).forEach(conv => {
        unreadMap[conv.id] = conv.unreadCount || 0;
      });
      setUnreadCounts(unreadMap);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      if (!token) return;
      
      // Use feature flag-aware method that can switch between mock and real API
      const response = await chatService.getMessages(token, conversationId);
      
      setMessagesState(prev => ({
        ...prev,
        [conversationId]: response.messages || [],
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (conversationId: number, content: string) => {
    try {
      if (!token || !user) return;

      const messageRequest: CreateMessageRequest = {
        conversationId,
        receiverId: 0, // This will be determined by the backend based on conversation
        content,
        messageType: MessageType.TEXT,
      };
      
      const newMessage = await chatService.sendMessage(token, messageRequest);
      
      // Add message to local state
      setMessagesState(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      // Update conversation with latest message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.sentAt }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const markAsRead = async (conversationId: number) => {
    try {
      if (!token) return;
      
      // Use feature flag-aware method that can switch between mock and real API
      await chatService.markAsRead(token, conversationId);
      
      // Update local state
      setMessagesState(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map((msg: Message) => 
          msg.receiverId === user?.id ? { ...msg, isRead: true } : msg
        ) || [],
      }));
      
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0,
      }));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // Additional methods for ChatScreen compatibility
  const markConversationAsRead = async (conversationId: number) => {
    await markAsRead(conversationId);
  };

  const sendTyping = (conversationId: number, isTyping: boolean) => {
    // For now, just log typing status
    console.log(`User ${user?.id} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);
  };

  const joinConversation = async (conversationId: number) => {
    try {
      setActiveConversation(conversationId);
      await loadMessages(conversationId);
    } catch (error) {
      console.error('Failed to join conversation:', error);
    }
  };

  const leaveConversation = async (conversationId: number) => {
    try {
      if (activeConversation === conversationId) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error('Failed to leave conversation:', error);
    }
  };

  // Helper methods for enhanced chat functionality
  const setMessages = (conversationId: number, newMessages: Message[]) => {
    setMessagesState(prev => ({
      ...prev,
      [conversationId]: newMessages,
    }));
  };

  const addMessage = (message: Message) => {
    setMessagesState(prev => ({
      ...prev,
      [message.conversationId]: [...(prev[message.conversationId] || []), message],
    }));
    
    // Update delivery status
    setDeliveryStatus(prev => ({
      ...prev,
      [message.id]: 'sent',
    }));
  };

  const updateMessage = (messageId: number, updates: Partial<Message>) => {
    setMessagesState(prev => {
      const updatedMessages = { ...prev };
      Object.keys(updatedMessages).forEach(conversationId => {
        updatedMessages[parseInt(conversationId)] = updatedMessages[parseInt(conversationId)].map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
      });
      return updatedMessages;
    });
  };

  const deleteMessage = (messageId: number) => {
    setMessagesState(prev => {
      const updatedMessages = { ...prev };
      Object.keys(updatedMessages).forEach(conversationId => {
        updatedMessages[parseInt(conversationId)] = updatedMessages[parseInt(conversationId)].filter(msg => msg.id !== messageId);
      });
      return updatedMessages;
    });
  };

  const reactToMessage = async (messageId: number, emoji: string) => {
    try {
      if (!token || !user) return;
      
      // TODO: Implement message reactions API
      console.log(`User ${user.id} reacted with ${emoji} to message ${messageId}`);
      
      // For now, just update local state
      updateMessage(messageId, {
        reactions: [
          {
            id: Date.now().toString(),
            userId: user.id,
            emoji,
            createdAt: new Date().toISOString(),
          }
        ]
      });
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  const editMessage = async (messageId: number, newContent: string) => {
    try {
      if (!token) return;
      
      // TODO: Implement message editing API
      console.log(`Editing message ${messageId} with content: ${newContent}`);
      
      // For now, just update local state
      updateMessage(messageId, {
        content: newContent,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        activeConversation,
        isConnected,
        unreadCounts,
        onlineUsers,
        typingUsers,
        deliveryStatus,
        setActiveConversation,
        setConversations,
        sendMessage,
        sendTyping,
        markAsRead,
        markConversationAsRead,
        loadConversations,
        loadMessages,
        setMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        joinConversation,
        leaveConversation,
        reactToMessage,
        editMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const useChat = useChatContext; // Alias for backward compatibility
