"use client";

/**
 * TanStack Query hooks for the messaging module. See `hooks/queries/products.ts`
 * for the reference shape.
 *
 * Messaging is realtime-ish, so the reads use a short `refetchInterval` to poll
 * for new conversations / messages instead of the old manual `setInterval`.
 * Writes are mutations that invalidate the affected thread + the threads list.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import messagingService from "@/services/messagingService";
import { createOrderOnBehalf } from "@/services/orderService";
import type { OnBehalfOrderPayload } from "@/types/order";
import type { SendMessageRequest } from "@/types/messaging";

/** How often the active thread + conversation list poll for new content. */
const MESSAGING_POLL_INTERVAL_MS = 15000;

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

const useCurrentUserId = () => useAppSelector((s) => s.auth.data?._id);

/** The current user's conversation list. */
export const useThreadsQuery = (
  limit?: number,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.messaging.threads(userId ?? "anonymous", limit),
    queryFn: () =>
      messagingService.listConversations(token as string, { limit }),
    enabled: Boolean(token) && (options?.enabled ?? true),
    refetchInterval: MESSAGING_POLL_INTERVAL_MS,
  });
};

/** A single conversation with its messages. */
export const useThreadQuery = (
  threadId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.messaging.thread(threadId ?? ""),
    queryFn: () =>
      messagingService.getConversation(token as string, threadId as string),
    enabled: Boolean(token) && Boolean(threadId) && (options?.enabled ?? true),
    refetchInterval: MESSAGING_POLL_INTERVAL_MS,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/** Send a message; refresh the thread and the conversation list. */
export const useSendMessageMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessageRequest) =>
      messagingService.sendMessage(token as string, payload),
    onSuccess: (_res, { conversationId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.messaging.thread(conversationId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.messaging.all });
    },
  });
};

/** Start (or reopen) a conversation with a receiver. */
export const useStartConversationMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) =>
      messagingService.startConversation(token as string, { receiverId }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.messaging.all }),
  });
};

/**
 * Distributor drafts an order on a buyer's behalf. The backend posts an
 * `order_proposal` message into the conversation, so invalidate the thread it
 * lands in plus the conversation list (last-message preview changes).
 */
export const useCreateOrderOnBehalfMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ payload }: { conversationId: string; payload: OnBehalfOrderPayload }) =>
      createOrderOnBehalf(token as string, payload),
    onSuccess: (_res, { conversationId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.messaging.thread(conversationId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.messaging.all });
    },
  });
};

export { useCurrentUserId };
