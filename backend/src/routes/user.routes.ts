import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';

const router = Router();

// GET /api/user/profile — Get learner profile & long-term memories
router.get('/profile', (req, res) => userController.getProfile(req, res));

// PUT /api/user/profile — Update learner preferences (skill level, language, goals)
router.put('/profile', (req, res) => userController.updateProfile(req, res));

// POST /api/user/memories — Add a custom learning note/memory
router.post('/memories', (req, res) => userController.addMemory(req, res));

// DELETE /api/user/memories/:id — Delete a specific memory
router.delete('/memories/:id', (req, res) => userController.deleteMemory(req, res));

// DELETE /api/user/memories — Clear all memories
router.delete('/memories', (req, res) => userController.clearMemories(req, res));

export default router;
