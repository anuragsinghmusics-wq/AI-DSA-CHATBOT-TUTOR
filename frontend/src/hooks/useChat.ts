'use client';

import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '@/lib/api';
import type { Message, ProblemContext } from '@/types';

/**
 * Custom hook for managing chat state and SSE streaming.
 * Handles message sending, streaming responses, chat history, and
 * proper cleanup via AbortController when the user clears chat.
 */
export function useChat(problemContext: ProblemContext | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: AbortController ref to cancel in-flight SSE connections
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send a message and stream the AI response.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!problemContext || !content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Cancel any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message immediately for instant feedback
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'USER',
        content: content.trim(),
        createdAt: new Date(),
      };

      // Add placeholder assistant message with streaming state
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'ASSISTANT',
        content: '',
        isStreaming: true,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      try {
        await sendChatMessage(
          problemContext.id,
          content.trim(),
          problemContext,
          sessionId,
          // onToken — append each character to the streaming message
          (token: string) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'ASSISTANT') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + token,
                };
              }
              return updated;
            });
          },
          // onDone — finalize the message with DB id and metadata
          (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'ASSISTANT') {
                updated[updated.length - 1] = {
                  ...last,
                  id: data.messageId || last.id,
                  intent: data.intent,
                  wasSafe: data.wasSafe,
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsLoading(false);
          },
          // onError
          (errorMsg: string) => {
            setError(errorMsg);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'ASSISTANT' && last.isStreaming) {
                updated[updated.length - 1] = {
                  ...last,
                  content: '⚠️ Sorry, an error occurred. Please try again.',
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsLoading(false);
          },
          // onMetadata
          (metadata) => {
            if (metadata.sessionId) {
              setSessionId(metadata.sessionId);
            }
          },
          // AbortSignal — so clearing chat cancels the in-flight request
          abortControllerRef.current.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Intentional abort, no error to show
        }
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    },
    [problemContext, isLoading, sessionId]
  );

  /**
   * Clear all messages and cancel any in-flight SSE request.
   */
  const clearMessages = useCallback(() => {
    // ✅ FIX: Actually cancel the in-flight fetch before clearing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    error,
    sendMessage,
    clearMessages,
  };
}
