'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/lib/api';
import type { Message, ProblemContext } from '@/types';

const STORAGE_KEY_PREFIX = 'deebug_chat_v2_';
const MAX_HISTORY = 10;

function storageKey(problemId: string) {
  return `${STORAGE_KEY_PREFIX}${problemId}`;
}

type PersistedMessage = Omit<Message, 'createdAt'> & { createdAt: string };

export interface HistorySession {
  id: string;
  startedAt: string;
  sessionId?: string;
  messages: Message[];
}

interface PersistedStore {
  active: { sessionId?: string; messages: PersistedMessage[] } | null;
  history: Array<{ id: string; startedAt: string; sessionId?: string; messages: PersistedMessage[] }>;
}

function deserializeMessages(raw: PersistedMessage[]): Message[] {
  return (raw || []).map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
}

function serializeMessages(messages: Message[]): PersistedMessage[] {
  return messages
    .filter((m) => !m.isStreaming)
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
}

function loadStore(problemId: string): PersistedStore {
  try {
    const raw = localStorage.getItem(storageKey(problemId));
    if (!raw) return { active: null, history: [] };
    return JSON.parse(raw) as PersistedStore;
  } catch {
    return { active: null, history: [] };
  }
}

function saveStore(problemId: string, store: PersistedStore) {
  try {
    localStorage.setItem(storageKey(problemId), JSON.stringify(store));
  } catch {
    // fail silently
  }
}

/**
 * Custom hook for managing chat state and SSE streaming.
 * Supports multiple sessions per problem (history + new chat).
 * Chat is persisted to localStorage per problem so a page refresh restores it.
 */
export function useChat(problemContext: ProblemContext | null, userCode: string, language: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<HistorySession[]>([]);
  const [viewingSession, setViewingSession] = useState<HistorySession | null>(null);

  const currentProblemIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load active chat + history from localStorage when problem changes
  useEffect(() => {
    if (!problemContext) return;
    const id = problemContext.id;

    if (currentProblemIdRef.current !== id) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      setError(null);
      setViewingSession(null);
    }

    currentProblemIdRef.current = id;
    const store = loadStore(id);

    const activeMessages = store.active ? deserializeMessages(store.active.messages) : [];
    setMessages(activeMessages);
    setSessionId(store.active?.sessionId);

    const history: HistorySession[] = (store.history || []).map((h) => ({
      id: h.id,
      startedAt: h.startedAt,
      sessionId: h.sessionId,
      messages: deserializeMessages(h.messages),
    }));
    setChatHistory(history);
  }, [problemContext?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Send a message and stream the AI response.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!problemContext || !content.trim() || isLoading) return;

      // If viewing a past session, close the history view first
      setViewingSession(null);

      setError(null);
      setIsLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'USER',
        content: content.trim(),
        createdAt: new Date(),
      };

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
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
          userCode,
          language,
          sessionId,
          // onToken
          (token: string) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'ASSISTANT') {
                updated[updated.length - 1] = { ...last, content: last.content + token };
              }
              return updated;
            });
          },
          // onDone
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
              // Persist to localStorage
              const store = loadStore(problemContext.id);
              store.active = { sessionId, messages: serializeMessages(updated) };
              saveStore(problemContext.id, store);
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
              const store = loadStore(problemContext.id);
              store.active = { sessionId, messages: serializeMessages(updated) };
              saveStore(problemContext.id, store);
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
          abortControllerRef.current.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    },
    [problemContext, isLoading, sessionId, userCode, language]
  );

  /**
   * Archive current chat to history and start a fresh session.
   */
  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const pid = currentProblemIdRef.current;
    if (!pid) return;

    const store = loadStore(pid);

    // Only archive if there are messages worth saving
    const currentMessages = messages.filter((m) => !m.isStreaming);
    if (currentMessages.length > 0) {
      const archived = {
        id: crypto.randomUUID(),
        startedAt: (currentMessages[0]?.createdAt ?? new Date()).toISOString(),
        sessionId,
        messages: serializeMessages(currentMessages),
      };
      const newHistory = [archived, ...(store.history || [])].slice(0, MAX_HISTORY);
      store.history = newHistory;

      // Update local state
      const historySession: HistorySession = {
        id: archived.id,
        startedAt: archived.startedAt,
        sessionId: archived.sessionId,
        messages: currentMessages,
      };
      setChatHistory((prev) => [historySession, ...prev].slice(0, MAX_HISTORY));
    }

    store.active = null;
    saveStore(pid, store);

    setMessages([]);
    setSessionId(undefined);
    setError(null);
    setIsLoading(false);
    setViewingSession(null);
  }, [messages, sessionId]);

  /**
   * Clear active chat without archiving.
   */
  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const pid = currentProblemIdRef.current;
    if (pid) {
      const store = loadStore(pid);
      store.active = null;
      saveStore(pid, store);
    }
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    setIsLoading(false);
    setViewingSession(null);
  }, []);

  /**
   * Delete a specific history session.
   */
  const deleteHistorySession = useCallback((id: string) => {
    const pid = currentProblemIdRef.current;
    if (!pid) return;
    const store = loadStore(pid);
    store.history = (store.history || []).filter((h) => h.id !== id);
    saveStore(pid, store);
    setChatHistory((prev) => prev.filter((h) => h.id !== id));
    setViewingSession((prev) => (prev?.id === id ? null : prev));
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    error,
    chatHistory,
    viewingSession,
    setViewingSession,
    sendMessage,
    startNewChat,
    clearMessages,
    deleteHistorySession,
  };
}
