import { Chat } from "@ai-sdk/react";
import type { ChatUIMessage } from "@/features/chat/message-parts";

/**
 * Maximum number of Chat instances kept in the cache.
 * Oldest entries (by insertion order) are evicted first when the limit is hit.
 */
export const CHAT_CACHE_MAX_SIZE = 50;

/**
 * Cache of Chat instances keyed by session ID.
 * Keeps streaming state alive when the user switches between sessions.
 * Capped at {@link CHAT_CACHE_MAX_SIZE} to prevent unbounded memory growth.
 */
export const chatCache = new Map<string, Chat<ChatUIMessage>>();

/**
 * Display labels for card-initiated sessions.
 * Maps sessionId → displayLabel so the first user message renders the label
 * instead of the raw constructed prompt.
 */
export const cardPromptLabels = new Map<string, string>();

/** Remove a session from the chat cache (e.g. on delete). */
export function evictChatSession(sessionId: string): void {
  chatCache.delete(sessionId);
  cardPromptLabels.delete(sessionId);
}

/** Ensure the cache stays within its size budget. */
export function trimChatCache(): void {
  while (chatCache.size > CHAT_CACHE_MAX_SIZE) {
    const oldestKey = chatCache.keys().next().value;
    if (oldestKey !== undefined) {
      chatCache.delete(oldestKey);
    }
  }
}
