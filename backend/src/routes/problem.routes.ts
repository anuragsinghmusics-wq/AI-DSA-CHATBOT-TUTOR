import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { validateParams } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const problemIdSchema = z.object({
  id: z.string().min(1, 'Invalid problem ID'),
});

// GET /api/problems — List all problems
router.get('/', (req, res) => chatController.getProblems(req, res));

// GET /api/problems/:id — Get problem detail
router.get(
  '/:id',
  validateParams(problemIdSchema),
  (req, res) => chatController.getProblem(req, res)
);

export default router;
