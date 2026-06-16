import type {
  Conversation,
  ConversationDetail,
  MessagingEnvelope,
  Message,
  SendMessageRequest,
  StartConversationRequest,
} from "@/types/messaging";
import { apiUrl } from "@/utils/api-base-url";

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
  requestJson<ConversationDetail>(`/conversations/${conversationId}`, token, {
    fallbackMessage: "Unable to load conversation",
  });

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
