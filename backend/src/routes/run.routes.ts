import { Router } from 'express';
import { z } from 'zod';
import { runCode } from '../controllers/run.controller.js';
import { validateBody } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const runRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty').max(50000, 'Code too long'),
  language: z.string().min(1, 'Language is required'),
  stdin: z.string().max(10000).optional(),
});

// POST /api/run — Execute code via Piston
router.post(
  '/',
  rateLimiter,
  validateBody(runRequestSchema),
  (req, res) => runCode(req, res)
);

export default router;
