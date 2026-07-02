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

/**
 * Message variants the backend can emit. `text` is a normal chat message;
 * `order_proposal` and `order_created` are system messages whose `attachment`
 * references an order, so the client renders them as rich order cards instead
 * of plain text.
 */
export type MessageType = "text" | "order_proposal" | "order_created";

/**
 * Structured payload attached to a system message. Today only `order` is set
 * (the related order id), but the shape is left open for future attachments.
 */
export interface MessageAttachment {
  order?: string;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  /** Defaults to "text" for plain chat messages. */
  type?: MessageType;
  /** Present on `order_proposal` / `order_created` system messages. */
  attachment?: MessageAttachment | null;
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
