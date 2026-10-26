import { Request, Response } from 'express';
import { memoryService } from '../services/memory.service.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { UpdateProfileRequest, CreateMemoryRequest } from '../types/index.js';

let DEV_USER_ID: string | null = null;

async function getDevUser() {
  if (DEV_USER_ID) {
    const user = await prisma.user.findUnique({ where: { id: DEV_USER_ID } });
    if (user) return user;
  }

  const user = await prisma.user.findFirst({ where: { email: 'dev@deebug.io' } });
  if (!user) {
    // If not seeded, create a default user
    const created = await prisma.user.create({
      data: {
        email: 'dev@deebug.io',
        name: 'Alex (DSA Learner)',
      },
    });
    DEV_USER_ID = created.id;
    return created;
  }

  DEV_USER_ID = user.id;
  return user;
}

export class UserController {
  /**
   * GET /api/user/profile
   * Return the active learner profile, long-term memories, and user details.
   */
  async getProfile(_req: Request, res: Response): Promise<void> {
    try {
      const user = await getDevUser();
      const profile = await memoryService.getUserProfile(user.id);
      const memories = await memoryService.getUserMemories(user.id, 50);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          profile,
          memories,
        },
      });
    } catch (error) {
      logger.error('Failed to get user profile', { error });
      res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
    }
  }

  /**
   * PUT /api/user/profile
   * Update learner preferences (skill level, preferred language, learning goals).
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await getDevUser();
      const body = req.body as UpdateProfileRequest;

      const updated = await memoryService.updateUserProfile(user.id, body);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('Failed to update user profile', { error });
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }

  /**
   * POST /api/user/memories
   * Add a manual memory or learning note for the AI to keep in mind.
   */
  async addMemory(req: Request, res: Response): Promise<void> {
    try {
      const user = await getDevUser();
      const body = req.body as CreateMemoryRequest;

      if (!body.content || !body.content.trim()) {
        res.status(400).json({ success: false, error: 'Memory content cannot be empty' });
        return;
      }

      const memory = await memoryService.addUserMemory(user.id, {
        category: body.category || 'WEAKNESS',
        content: body.content.trim(),
        sourceProblem: body.sourceProblem,
      });

      res.json({
        success: true,
        data: memory,
      });
    } catch (error) {
      logger.error('Failed to add user memory', { error });
      res.status(500).json({ success: false, error: 'Failed to add memory' });
    }
  }

  /**
   * DELETE /api/user/memories/:id
   * Delete an individual memory.
   */
  async deleteMemory(req: Request, res: Response): Promise<void> {
    try {
      const user = await getDevUser();
      const memoryId = req.params.id as string;

      const deleted = await memoryService.deleteUserMemory(memoryId, user.id);

      res.json({
        success: true,
        data: { deleted },
      });
    } catch (error) {
      logger.error('Failed to delete memory', { error });
      res.status(500).json({ success: false, error: 'Failed to delete memory' });
    }
  }

  /**
   * DELETE /api/user/memories
   * Clear all memories for the user.
   */
  async clearMemories(_req: Request, res: Response): Promise<void> {
    try {
      const user = await getDevUser();
      const count = await memoryService.clearUserMemories(user.id);

      res.json({
        success: true,
        data: { clearedCount: count },
      });
    } catch (error) {
      logger.error('Failed to clear memories', { error });
      res.status(500).json({ success: false, error: 'Failed to clear memories' });
    }
  }
}

export const userController = new UserController();
