import { Router } from 'express';
import { z } from 'zod';
import { chatController } from '../controllers/chat.controller.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ---- Validation Schemas ----

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  problemId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  problemContext: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    constraints: z.array(z.string()),
    examples: z.array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    ),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    tags: z.array(z.string()),
  }),
});

const sessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

const problemIdSchema = z.object({
  id: z.string().uuid('Invalid problem ID'),
});

const feedbackSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ---- Routes ----

// POST /api/chat — Send message (SSE streaming)
router.post(
  '/',
  rateLimiter,
  validateBody(chatRequestSchema),
  (req, res) => chatController.chat(req, res)
);

// GET /api/chat/history/:sessionId — Get chat history
router.get(
  '/history/:sessionId',
  validateParams(sessionIdSchema),
  (req, res) => chatController.getHistory(req, res)
);

// DELETE /api/chat/history/:sessionId — Delete chat history
router.delete(
  '/history/:sessionId',
  validateParams(sessionIdSchema),
  (req, res) => chatController.deleteHistory(req, res)
);

// POST /api/chat/feedback — Submit feedback
router.post(
  '/feedback',
  validateBody(feedbackSchema),
  (req, res) => chatController.submitFeedback(req, res)
);

export default router;
