import type { UserRole } from "@/types/user";

export interface ConversationCounterpart {
  id: string;
  role: UserRole | string;
  displayName: string;
  avatarUrl?: string | null;
  secondaryLabel?: string | null;
  isVerifiedSeller: boolean;
}

export interface Conversation {
  id: string;
  participants: [string, string];
  createdAt: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  counterpart: ConversationCounterpart;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface StartConversationRequest {
  receiverId: string;
}

export interface SendMessageRequest {
  conversationId: string;
  text: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface MessagingEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
