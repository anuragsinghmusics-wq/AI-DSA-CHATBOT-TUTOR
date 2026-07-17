import { prisma } from '../config/database.js';
import { MessageRole } from '../types/index.js';

/**
 * Repository for chat-related database operations.
 * Follows the repository pattern — pure data access, no business logic.
 */
export class ChatRepository {
  /**
   * Find or create a chat session for a user + problem combination.
   */
  async findOrCreateSession(userId: string, problemId?: string): Promise<string> {
    // Check if problemId is a valid UUID (since dynamic frontend problems might pass random strings)
    const isUuid = problemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(problemId);
    const validProblemId = isUuid ? problemId : undefined;

    // Check for existing active session
    if (validProblemId) {
      const existing = await prisma.chatSession.findFirst({
        where: { userId, problemId: validProblemId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        return existing.id;
      }
    }

    // Create new session
    const session = await prisma.chatSession.create({
      data: { userId, problemId: validProblemId },
    });

    return session.id;
  }

  /**
   * Get a session by ID with messages.
   */
  async getSessionWithMessages(sessionId: string) {
    return prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        problem: true,
      },
    });
  }

  /**
   * Save a user message.
   */
  async saveUserMessage(sessionId: string, content: string) {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content,
      },
    });
  }

  /**
   * Save an assistant message with safety metadata.
   */
  async saveAssistantMessage(
    sessionId: string,
    content: string,
    intent: string,
    wasSafe: boolean
  ) {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content,
        intent,
        wasSafe,
      },
    });
  }

  /**
   * Get chat history for a session.
   */
  async getHistory(sessionId: string) {
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get recent messages for context window (last N messages).
   */
  async getRecentMessages(sessionId: string, limit: number = 10) {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse();
  }

  /**
   * Delete a chat session and all its messages.
   */
  async deleteSession(sessionId: string) {
    return prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Save feedback for a message.
   */
  async saveFeedback(messageId: string, rating: number, comment?: string) {
    return prisma.feedback.create({
      data: {
        messageId,
        rating,
        comment,
      },
    });
  }
}

export const chatRepository = new ChatRepository();
