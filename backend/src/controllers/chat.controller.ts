import { Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import { problemService } from '../services/problem.service.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import type { ChatRequest, FeedbackRequest } from '../types/index.js';

/**
 * Chat controller — handles HTTP layer concerns:
 * request parsing, SSE streaming setup, and response formatting.
 */
export class ChatController {
  /**
   * POST /api/chat
   * Streams AI response via Server-Sent Events.
   */
  async chat(req: Request, res: Response): Promise<void> {
    const body = req.body as ChatRequest;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders(); // Tell client we have successfully connected!

    // Handle client disconnect
    let isClientConnected = true;
    res.on('close', () => { // listen to res, not req
      isClientConnected = false;
      logger.debug('Client disconnected from SSE stream');
    });

    try {
      const stream = chatService.processMessage(body);

      for await (const event of stream) {
        if (!isClientConnected) break;

        // Write SSE-formatted event
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${event.data}\n\n`);
      }
    } catch (error) {
      logger.error('Chat stream error', { error });
      if (isClientConnected) {
        res.write(`event: error\n`);
        res.write(`data: Internal server error\n\n`);
      }
    } finally {
      if (isClientConnected) {
        res.end();
      }
    }
  }

  /**
   * GET /api/chat/history/:sessionId
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    const sessionId = req.params.sessionId as string;

    const messages = await chatService.getHistory(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        messages,
      },
    });
  }

  /**
   * DELETE /api/chat/history/:sessionId
   */
  async deleteHistory(req: Request, res: Response): Promise<void> {
    const sessionId = req.params.sessionId as string;

    await chatService.deleteHistory(sessionId);

    res.json({
      success: true,
      message: 'Chat history deleted',
    });
  }

  /**
   * POST /api/chat/feedback
   */
  async submitFeedback(req: Request, res: Response): Promise<void> {
    const { messageId, rating, comment } = req.body as FeedbackRequest;

    const feedback = await chatService.submitFeedback(messageId, rating, comment);

    res.json({
      success: true,
      data: feedback,
    });
  }

  /**
   * GET /api/problems
   */
  async getProblems(_req: Request, res: Response): Promise<void> {
    const problems = await problemService.getAllProblems();

    res.json({
      success: true,
      data: problems,
    });
  }

  /**
   * GET /api/problems/:id
   */
  async getProblem(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const problem = await problemService.getProblemById(id);

    if (!problem) {
      throw createError('Problem not found', 404);
    }

    res.json({
      success: true,
      data: problem,
    });
  }
}

export const chatController = new ChatController();
