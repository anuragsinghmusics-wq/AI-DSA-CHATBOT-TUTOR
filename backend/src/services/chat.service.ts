import { chatRepository } from '../repositories/chat.repository.js';
import { runTutorPipeline } from '../ai/graph/workflow.js';
import { logger } from '../utils/logger.js';
import type { ChatRequest, ProblemContext, ChatMessageData } from '../types/index.js';

import { prisma } from '../config/database.js';

/**
 * In-memory cache for the dev user ID.
 * This is re-fetched on each server start but cached across requests.
 * TODO: Replace with real auth middleware before production deployment.
 */
let DEV_USER_ID: string | null = null;

async function getDevUserId(): Promise<string> {
  if (DEV_USER_ID) return DEV_USER_ID;

  const user = await prisma.user.findFirst({ where: { email: 'dev@deebug.io' } });
  if (!user) {
    throw new Error(
      'Dev user "dev@deebug.io" not found in the database. ' +
      'Please run: npm run db:seed'
    );
  }
  DEV_USER_ID = user.id;
  return DEV_USER_ID;
}

/**
 * Chat service — orchestrates the AI pipeline and persists messages.
 * This is the main business logic layer.
 */
export class ChatService {
  /**
   * Process a chat message through the AI pipeline.
   * Returns an async generator that yields SSE tokens for streaming.
   */
  async *processMessage(request: ChatRequest): AsyncGenerator<{
    type: 'token' | 'done' | 'error' | 'metadata';
    data: string;
    messageId?: string;
  }> {
    const { problemId, message, problemContext, sessionId: existingSessionId } = request;

    try {
      // Get (or cache) the dev user ID
      const userId = await getDevUserId();

      // 1. Find or create session
      const sessionId = existingSessionId ||
        await chatRepository.findOrCreateSession(userId, problemId);

      // Emit session metadata immediately so the frontend can track the session
      yield { type: 'metadata', data: JSON.stringify({ sessionId }) };

      // 2. Save user message to DB
      await chatRepository.saveUserMessage(sessionId, message);

      // 3. Get recent chat history for context window
      const recentMessages = await chatRepository.getRecentMessages(sessionId, 10);
      const chatHistory: ChatMessageData[] = recentMessages.map((msg) => ({
        id: msg.id,
        sessionId: msg.sessionId,
        role: msg.role as ChatMessageData['role'],
        content: msg.content,
        intent: msg.intent ?? undefined,
        wasSafe: msg.wasSafe,
        createdAt: msg.createdAt,
      }));

      // 4. Run the LangGraph AI pipeline
      logger.info('Running AI pipeline', {
        sessionId,
        problemTitle: problemContext.title,
        userMessage: message.substring(0, 100),
      });

      let fullResponse = '';
      let intent = 'unknown';
      let wasSafe = true;

      const pipeline = runTutorPipeline({
        userMessage: message,
        problemContext,
        chatHistory,
      });

      for await (const event of pipeline) {
        if (event.type === 'token') {
          // ✅ FIX: event.data is JSON.stringify(char), so we must parse it back
          // before accumulating into fullResponse, otherwise DB gets '"a""b""c"' instead of 'abc'
          try {
            const decoded = JSON.parse(event.data);
            fullResponse += typeof decoded === 'string' ? decoded : event.data;
          } catch {
            fullResponse += event.data;
          }
          // Forward the raw JSON-encoded token to the SSE stream (frontend parses it)
          yield { type: 'token', data: event.data };
        } else if (event.type === 'intent') {
          intent = event.data;
        } else if (event.type === 'safety') {
          wasSafe = event.data === 'safe';
        } else if (event.type === 'error') {
          logger.error('Pipeline error', { error: event.data });
          yield { type: 'error', data: event.data };
          return;
        }
      }

      // 5. Save the complete assistant response to DB
      const savedMessage = await chatRepository.saveAssistantMessage(
        sessionId,
        fullResponse,
        intent,
        wasSafe
      );

      // 6. Emit done event with metadata
      yield {
        type: 'done',
        data: JSON.stringify({ messageId: savedMessage.id, intent, wasSafe }),
        messageId: savedMessage.id,
      };

      logger.info('Chat response completed', {
        sessionId,
        intent,
        wasSafe,
        responseLength: fullResponse.length,
      });
    } catch (error) {
      logger.error('Chat service error', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      yield {
        type: 'error',
        data: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /** Get chat history for a session. */
  async getHistory(sessionId: string) {
    return chatRepository.getHistory(sessionId);
  }

  /** Delete a chat session and all its messages. */
  async deleteHistory(sessionId: string) {
    return chatRepository.deleteSession(sessionId);
  }

  /** Submit feedback for a message. */
  async submitFeedback(messageId: string, rating: number, comment?: string) {
    return chatRepository.saveFeedback(messageId, rating, comment);
  }
}

export const chatService = new ChatService();
