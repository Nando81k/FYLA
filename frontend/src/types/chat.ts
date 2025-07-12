export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: MessageType;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
  deliveredAt?: string;
  sender?: import('./index').User;
  receiver?: import('./index').User;
  // Enhanced features
  attachments?: MessageAttachment[];
  replyTo?: Message;
  reactions?: MessageReaction[];
  isEdited?: boolean;
  editedAt?: string;
  metadata?: MessageMetadata;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MessageReaction {
  id: string;
  userId: number;
  emoji: string;
  createdAt: string;
}

export interface MessageMetadata {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  appointmentData?: {
    serviceId: number;
    providerId: number;
    datetime: string;
    duration: number;
    price?: number;
  };
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  APPOINTMENT_REQUEST = 'appointment_request',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_CANCELLATION = 'appointment_cancellation',
  SYSTEM = 'system',
}

export interface TypingIndicator {
  userId: number;
  conversationId: number;
  isTyping: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: number;
  clientId: number;
  providerId: number;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  client?: import('./index').User;
  provider?: import('./index').User;
}

export interface CreateMessageRequest {
  conversationId?: number;
  receiverId: number;
  content: string;
  messageType?: MessageType;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}
