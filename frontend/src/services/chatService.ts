import { Message, Conversation, CreateMessageRequest, ConversationListResponse, MessagesResponse } from '@/types/chat';
import { ServiceFactory } from './apiService';
import { API_ENDPOINTS, FEATURE_FLAGS } from '../config/api';

interface BackendConversationDto {
  id: number;
  user1Id: number;
  user2Id: number;
  user1?: any;
  user2?: any;
  lastMessage?: any;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendMessageDto {
  id: number;
  senderId: number;
  receiverId: number;
  conversationId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: any;
}

class ChatService {
  async getConversations(
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ConversationListResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CHAT_API,
      () => this.getConversationsReal(token, page, limit),
      () => this.getMockConversations()
    );
  }

  private async getConversationsReal(
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ConversationListResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const backendConversations = await apiService.get<BackendConversationDto[]>(
        API_ENDPOINTS.CHAT.CONVERSATIONS,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Transform backend format to frontend format
      const conversations: Conversation[] = (backendConversations || []).map(conv => {
        const user1 = conv.user1;
        const user2 = conv.user2;
        
        return {
          id: conv.id,
          clientId: conv.user1Id,
          providerId: conv.user2Id,
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage.id,
            conversationId: conv.id,
            senderId: conv.lastMessage.senderId,
            receiverId: conv.lastMessage.receiverId,
            content: conv.lastMessage.content,
            messageType: 'text' as any,
            isRead: conv.lastMessage.isRead,
            sentAt: conv.lastMessage.createdAt,
            sender: conv.lastMessage.sender,
          } : undefined,
          unreadCount: conv.unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          client: user1 ? {
            id: user1.id,
            role: user1.role || 'Client',
            fullName: user1.fullName || `${user1.firstName} ${user1.lastName}`,
            email: user1.email,
            phoneNumber: user1.phoneNumber,
            profilePictureUrl: user1.profilePictureUrl,
            createdAt: user1.createdAt,
            updatedAt: user1.updatedAt,
          } : undefined,
          provider: user2 ? {
            id: user2.id,
            role: user2.role || 'Provider',
            fullName: user2.fullName || `${user2.firstName} ${user2.lastName}`,
            email: user2.email,
            phoneNumber: user2.phoneNumber,
            profilePictureUrl: user2.profilePictureUrl,
            createdAt: user2.createdAt,
            updatedAt: user2.updatedAt,
          } : undefined,
        };
      });
      
      return {
        conversations,
        total: conversations.length,
        hasMore: false,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMessages(
    token: string,
    conversationId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CHAT_API,
      () => this.getMessagesReal(token, conversationId, page, limit),
      () => this.getMockMessages(conversationId)
    );
  }

  private async getMessagesReal(
    token: string,
    conversationId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const backendMessages = await apiService.get<BackendMessageDto[]>(
        API_ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId),
        {
          params: { page, pageSize: limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Transform backend format to frontend format
      const messages: Message[] = (backendMessages || []).map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        messageType: 'text' as any,
        isRead: msg.isRead,
        sentAt: msg.createdAt,
        sender: msg.sender ? {
          id: msg.sender.id,
          role: msg.sender.role || 'client',
          fullName: msg.sender.fullName || `${msg.sender.firstName} ${msg.sender.lastName}`,
          email: msg.sender.email,
          phoneNumber: msg.sender.phoneNumber,
          profilePictureUrl: msg.sender.profilePictureUrl,
          createdAt: msg.sender.createdAt,
          updatedAt: msg.sender.updatedAt,
        } : undefined,
      }));

      return {
        messages: messages.reverse(), // Most recent first
        total: messages.length,
        hasMore: false,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessage(
    token: string,
    messageData: CreateMessageRequest
  ): Promise<Message> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CHAT_API,
      () => this.sendMessageReal(token, messageData),
      () => this.sendMockMessage(messageData)
    );
  }

  private async sendMessageReal(
    token: string,
    messageData: CreateMessageRequest
  ): Promise<Message> {
    try {
      const apiService = ServiceFactory.getApiService();
      const backendMessage = await apiService.post<BackendMessageDto>(
        API_ENDPOINTS.CHAT.MESSAGES,
        {
          conversationId: messageData.conversationId,
          content: messageData.content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Transform backend format to frontend format
      return {
        id: backendMessage.id,
        conversationId: backendMessage.conversationId,
        senderId: backendMessage.senderId,
        receiverId: backendMessage.receiverId,
        content: backendMessage.content,
        messageType: 'text' as any,
        isRead: backendMessage.isRead,
        sentAt: backendMessage.createdAt,
        sender: backendMessage.sender ? {
          id: backendMessage.sender.id,
          role: backendMessage.sender.role || 'client',
          fullName: backendMessage.sender.fullName || `${backendMessage.sender.firstName} ${backendMessage.sender.lastName}`,
          email: backendMessage.sender.email,
          phoneNumber: backendMessage.sender.phoneNumber,
          profilePictureUrl: backendMessage.sender.profilePictureUrl,
          createdAt: backendMessage.sender.createdAt,
          updatedAt: backendMessage.sender.updatedAt,
        } : undefined,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markAsRead(
    token: string,
    conversationId: number
  ): Promise<void> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CHAT_API,
      () => this.markAsReadReal(token, conversationId),
      () => this.markAsReadMock(conversationId)
    );
  }

  private async markAsReadReal(
    token: string,
    conversationId: number
  ): Promise<void> {
    try {
      const apiService = ServiceFactory.getApiService();
      await apiService.put(
        API_ENDPOINTS.CHAT.MARK_CONVERSATION_READ(conversationId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async markAsReadMock(conversationId: number): Promise<void> {
    await ServiceFactory.getApiService().simulateMockDelay();
    // Mock implementation - just simulate delay
  }

  async createOrGetConversation(
    token: string,
    participantId: number
  ): Promise<Conversation> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CHAT_API,
      () => this.createOrGetConversationReal(token, participantId),
      () => this.createOrGetConversationMock(participantId)
    );
  }

  private async createOrGetConversationReal(
    token: string,
    participantId: number
  ): Promise<Conversation> {
    try {
      const apiService = ServiceFactory.getApiService();
      const backendConversation = await apiService.post<BackendConversationDto>(
        API_ENDPOINTS.CHAT.CONVERSATIONS,
        { otherUserId: participantId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Transform backend format to frontend format
      const user1 = backendConversation.user1;
      const user2 = backendConversation.user2;
      
      return {
        id: backendConversation.id,
        clientId: backendConversation.user1Id,
        providerId: backendConversation.user2Id,
        lastMessage: backendConversation.lastMessage ? {
          id: backendConversation.lastMessage.id,
          conversationId: backendConversation.id,
          senderId: backendConversation.lastMessage.senderId,
          receiverId: backendConversation.lastMessage.receiverId,
          content: backendConversation.lastMessage.content,
          messageType: 'text' as any,
          isRead: backendConversation.lastMessage.isRead,
          sentAt: backendConversation.lastMessage.createdAt,
          sender: backendConversation.lastMessage.sender,
        } : undefined,
        unreadCount: backendConversation.unreadCount,
        createdAt: backendConversation.createdAt,
        updatedAt: backendConversation.updatedAt,
        client: user1 ? {
          id: user1.id,
          role: user1.role || 'Client',
          fullName: user1.fullName || `${user1.firstName} ${user1.lastName}`,
          email: user1.email,
          phoneNumber: user1.phoneNumber,
          profilePictureUrl: user1.profilePictureUrl,
          createdAt: user1.createdAt,
          updatedAt: user1.updatedAt,
        } : undefined,
        provider: user2 ? {
          id: user2.id,
          role: user2.role || 'Provider',
          fullName: user2.fullName || `${user2.firstName} ${user2.lastName}`,
          email: user2.email,
          phoneNumber: user2.phoneNumber,
          profilePictureUrl: user2.profilePictureUrl,
          createdAt: user2.createdAt,
          updatedAt: user2.updatedAt,
        } : undefined,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async createOrGetConversationMock(participantId: number): Promise<Conversation> {
    await ServiceFactory.getApiService().simulateMockDelay();

    return {
      id: Math.floor(Math.random() * 1000),
      clientId: 1,
      providerId: participantId,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider: {
        id: participantId,
        role: 'provider' as any,
        fullName: 'Mock Provider',
        email: 'provider@example.com',
        phoneNumber: '+1234567890',
        profilePictureUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // Mock functions for development
  async getMockConversations(): Promise<ConversationListResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockConversations: Conversation[] = [
      {
        id: 1,
        clientId: 1,
        providerId: 2,
        unreadCount: 2,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastMessage: {
          id: 5,
          conversationId: 1,
          senderId: 2,
          receiverId: 1,
          content: 'Great! I have availability tomorrow at 2 PM. Would that work for you?',
          messageType: 'text' as any,
          isRead: false,
          sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        provider: {
          id: 2,
          role: 'provider' as any,
          fullName: 'Sarah Johnson',
          email: 'sarah@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 2,
        clientId: 1,
        providerId: 3,
        unreadCount: 0,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastMessage: {
          id: 8,
          conversationId: 2,
          senderId: 1,
          receiverId: 3,
          content: 'Thank you so much! The haircut looks amazing 😊',
          messageType: 'text' as any,
          isRead: true,
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        },
        provider: {
          id: 3,
          role: 'provider' as any,
          fullName: 'Maria Garcia',
          email: 'maria@example.com',
          phoneNumber: '+1234567891',
          profilePictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    return {
      conversations: mockConversations,
      total: mockConversations.length,
      hasMore: false,
    };
  }

  async getMockMessages(conversationId: number): Promise<MessagesResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockMessages: Message[] = [
      {
        id: 1,
        conversationId: conversationId,
        senderId: 1,
        receiverId: 2,
        content: 'Hi! I\'m interested in booking a haircut appointment.',
        messageType: 'text' as any,
        isRead: true,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
        sender: {
          id: 1,
          role: 'client' as any,
          fullName: 'Current User',
          email: 'user@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 2,
        conversationId: conversationId,
        senderId: 2,
        receiverId: 1,
        content: 'Hello! I\'d be happy to help you with that. What style are you looking for?',
        messageType: 'text' as any,
        isRead: true,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        sender: {
          id: 2,
          role: 'provider' as any,
          fullName: 'Sarah Johnson',
          email: 'sarah@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 3,
        conversationId: conversationId,
        senderId: 1,
        receiverId: 2,
        content: 'I\'m thinking of a modern bob cut, similar to what I see in your portfolio.',
        messageType: 'text' as any,
        isRead: true,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        sender: {
          id: 1,
          role: 'client' as any,
          fullName: 'Current User',
          email: 'user@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 4,
        conversationId: conversationId,
        senderId: 1,
        receiverId: 2,
        content: 'When would be the best time for you this week?',
        messageType: 'text' as any,
        isRead: true,
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        sender: {
          id: 1,
          role: 'client' as any,
          fullName: 'Current User',
          email: 'user@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 5,
        conversationId: conversationId,
        senderId: 2,
        receiverId: 1,
        content: 'Great! I have availability tomorrow at 2 PM. Would that work for you?',
        messageType: 'text' as any,
        isRead: false,
        sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        sender: {
          id: 2,
          role: 'provider' as any,
          fullName: 'Sarah Johnson',
          email: 'sarah@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    return {
      messages: mockMessages.reverse(), // Most recent first
      total: mockMessages.length,
      hasMore: false,
    };
  }

  async sendMockMessage(messageData: CreateMessageRequest): Promise<Message> {
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockMessage: Message = {
      id: Math.floor(Math.random() * 1000),
      conversationId: messageData.conversationId || 1,
      senderId: 1, // Current user
      receiverId: messageData.receiverId,
      content: messageData.content,
      messageType: messageData.messageType || 'text' as any,
      isRead: false,
      sentAt: new Date().toISOString(),
      sender: {
        id: 1,
        role: 'client' as any,
        fullName: 'Current User',
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        profilePictureUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return mockMessage;
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Chat operation failed';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }
}

export const chatService = new ChatService();
