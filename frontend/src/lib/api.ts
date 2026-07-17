import type { ProblemContext, ProblemListItem, Message, FeedbackRequest } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * API client for communicating with the Deebug Chatbot backend.
 */

/**
 * Send a chat message and receive a streaming SSE response.
 * Accepts an AbortSignal so the caller can cancel the in-flight request
 * when the user navigates away or clears the chat.
 */
export async function sendChatMessage(
  problemId: string | undefined,
  message: string,
  problemContext: ProblemContext,
  sessionId?: string,
  onToken: (token: string) => void = () => {},
  onDone: (data: { messageId: string; intent: string; wasSafe: boolean }) => void = () => {},
  onError: (error: string) => void = () => {},
  onMetadata: (data: { sessionId: string }) => void = () => {},
  signal?: AbortSignal  // ✅ FIX: Accept AbortSignal to properly cancel SSE connections
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemId,
        message,
        problemContext,
        sessionId,
      }),
      signal, // ✅ Pass signal to fetch so the connection is cancelled server-side too
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return; // Silently ignore aborts — they are intentional
    }
    onError(err instanceof Error ? err.message : 'Request failed');
    return;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    onError(errorData.error || `HTTP ${response.status}`);
    return;
  }

  if (!response.body) {
    onError('No response body');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      // If aborted, stop reading
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let eventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6);

          switch (eventType) {
            case 'token':
              try {
                onToken(JSON.parse(data));
              } catch {
                onToken(data);
              }
              break;
            case 'done':
              try {
                const parsed = JSON.parse(data);
                onDone(parsed);
              } catch {
                onDone({ messageId: '', intent: 'unknown', wasSafe: true });
              }
              break;
            case 'error':
              onError(data);
              break;
            case 'metadata':
              try {
                const parsed = JSON.parse(data);
                onMetadata(parsed);
              } catch {
                // ignore metadata parse errors
              }
              break;
          }
          eventType = '';
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return; // Intentional abort — don't report as error
    }
    onError(err instanceof Error ? err.message : 'Stream read error');
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get chat history for a session.
 */
export async function getChatHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chat/history/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  const data = await res.json();
  return data.data.messages;
}

/**
 * Delete chat history for a session.
 */
export async function deleteChatHistory(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/history/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete chat history');
}

/**
 * Submit feedback for a message.
 */
export async function submitFeedback(feedback: FeedbackRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
}

/**
 * Get all problems.
 */
export async function getProblems(): Promise<ProblemListItem[]> {
  const res = await fetch(`${API_BASE}/problems`);
  if (!res.ok) throw new Error('Failed to fetch problems');
  const data = await res.json();
  return data.data;
}

/**
 * Get a single problem by ID.
 */
export async function getProblemById(id: string): Promise<ProblemContext> {
  const res = await fetch(`${API_BASE}/problems/${id}`);
  if (!res.ok) throw new Error('Failed to fetch problem');
  const data = await res.json();
  return data.data.context || data.data;
}
