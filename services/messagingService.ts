import type {
  Conversation,
  ConversationDetail,
  MessagingEnvelope,
  Message,
  MessageAttachment,
  MessageType,
  SendMessageRequest,
  StartConversationRequest,
} from "@/types/messaging";
import { apiUrl } from "@/utils/api-base-url";

/**
 * Backend messages may arrive either pre-mapped (camelCase: `id`, `senderId`,
 * `conversationId`) or as raw Mongo documents (`_id`, `sender`, `conversation`).
 * System messages additionally carry a `type` and an `attachment.order`. This
 * normalizer collapses both shapes into our `Message` contract so the UI can
 * rely on stable field names and render order cards from `attachment.order`.
 */
const ORDER_MESSAGE_TYPES: MessageType[] = ["order_proposal", "order_created"];

const toId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    const inner = (value as { _id?: unknown })._id;
    if (typeof inner === "string") return inner;
  }
  return "";
};

const normalizeMessage = (raw: unknown): Message => {
  const record = (raw ?? {}) as Record<string, unknown>;
  const rawType = record.type;
  const type: MessageType = ORDER_MESSAGE_TYPES.includes(rawType as MessageType)
    ? (rawType as MessageType)
    : "text";

  const attachmentSource = record.attachment as
    | Record<string, unknown>
    | null
    | undefined;
  const attachment: MessageAttachment | null = attachmentSource
    ? { ...attachmentSource, order: toId(attachmentSource.order) || undefined }
    : null;

  return {
    id: toId(record.id ?? record._id),
    conversationId: toId(record.conversationId ?? record.conversation),
    senderId: toId(record.senderId ?? record.sender),
    text: typeof record.text === "string" ? record.text : "",
    type,
    attachment,
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : "",
  };
};

const normalizeConversationDetail = (raw: unknown): ConversationDetail => {
  const record = (raw ?? {}) as {
    conversation: Conversation;
    messages?: unknown[];
  };
  return {
    conversation: record.conversation,
    messages: Array.isArray(record.messages)
      ? record.messages.map(normalizeMessage)
      : [],
  };
};

const parseJsonResponse = async <T>(
  response: Response,
): Promise<MessagingEnvelope<T> | null> => {
  try {
    return (await response.json()) as MessagingEnvelope<T>;
  } catch {
    return null;
  }
};

const parseError = async (
  response: Response,
  fallback: string,
): Promise<never> => {
  const payload = await parseJsonResponse<unknown>(response);
  const message =
    payload?.message ||
    (payload as unknown as { error?: { message?: string } })?.error?.message ||
    fallback;
  throw new Error(message);
};

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const requestJson = async <TResponse, TBody = unknown>(
  path: string,
  token: string,
  options: {
    method?: "GET" | "POST";
    body?: TBody;
    fallbackMessage: string;
  },
): Promise<TResponse> => {
  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers: authHeaders(token),
    credentials: "include",
    cache: "no-store",
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    return parseError(response, options.fallbackMessage);
  }

  const payload = await parseJsonResponse<TResponse>(response);

  if (!payload?.success) {
    throw new Error(payload?.message || options.fallbackMessage);
  }

  return payload.data;
};

const startConversation = (
  token: string,
  payload: StartConversationRequest,
): Promise<Conversation> =>
  requestJson<Conversation, StartConversationRequest>(
    "/conversations/start",
    token,
    {
      method: "POST",
      body: payload,
      fallbackMessage: "Unable to start conversation",
    },
  );

const listConversations = (
  token: string,
  params?: { page?: number; limit?: number },
): Promise<Conversation[]> => {
  const query = new URLSearchParams();
  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const path = query.size > 0 ? `/conversations?${query.toString()}` : "/conversations";

  return requestJson<Conversation[]>(path, token, {
    fallbackMessage: "Unable to load conversations",
  });
};

const getConversation = (
  token: string,
  conversationId: string,
): Promise<ConversationDetail> =>
  requestJson<unknown>(`/conversations/${conversationId}`, token, {
    fallbackMessage: "Unable to load conversation",
  }).then(normalizeConversationDetail);

const sendMessage = (
  token: string,
  payload: SendMessageRequest,
): Promise<Message> =>
  requestJson<Message, SendMessageRequest>("/messages/send", token, {
    method: "POST",
    body: payload,
    fallbackMessage: "Unable to send message",
  });

const messagingService = {
  startConversation,
  listConversations,
  getConversation,
  sendMessage,
};

export default messagingService;
