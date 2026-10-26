import { prisma } from '../config/database.js';
import type { UserProfileData, UserMemoryData, MemoryCategory } from '../types/index.js';

export class UserRepository {
  /**
   * Get an existing user profile or create a default one if none exists.
   */
  async getOrCreateProfile(userId: string): Promise<UserProfileData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        name: user?.name,
        email: user?.email,
        skillLevel: existing.skillLevel as UserProfileData['skillLevel'],
        preferredLanguage: existing.preferredLanguage,
        learningGoals: existing.learningGoals,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    const created = await prisma.userProfile.create({
      data: {
        userId,
        skillLevel: 'INTERMEDIATE',
        preferredLanguage: 'cpp',
        learningGoals: 'Master algorithm patterns and problem solving',
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      name: user?.name,
      email: user?.email,
      skillLevel: created.skillLevel as UserProfileData['skillLevel'],
      preferredLanguage: created.preferredLanguage,
      learningGoals: created.learningGoals,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update the user profile preferences and user name.
   */
  async updateProfile(
    userId: string,
    data: Partial<Pick<UserProfileData, 'name' | 'skillLevel' | 'preferredLanguage' | 'learningGoals'>>
  ): Promise<UserProfileData> {
    // Ensure profile exists first
    await this.getOrCreateProfile(userId);

    if (data.name && data.name.trim()) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name.trim() },
      });
    }

    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        ...(data.skillLevel ? { skillLevel: data.skillLevel } : {}),
        ...(data.preferredLanguage ? { preferredLanguage: data.preferredLanguage } : {}),
        ...(data.learningGoals ? { learningGoals: data.learningGoals } : {}),
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: user?.name,
      email: user?.email,
      skillLevel: updated.skillLevel as UserProfileData['skillLevel'],
      preferredLanguage: updated.preferredLanguage,
      learningGoals: updated.learningGoals,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Get all active long-term memories for a user, sorted newest first.
   */
  async getMemories(userId: string, limit: number = 20): Promise<UserMemoryData[]> {
    const memories = await prisma.userMemory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return memories.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      category: m.category as MemoryCategory,
      content: m.content,
      sourceProblem: m.sourceProblem,
      confidence: m.confidence,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  /**
   * Add a new long-term memory for a user.
   * If a memory with nearly identical content already exists, skip to prevent duplicates.
   */
  async addMemory(
    userId: string,
    data: {
      category: MemoryCategory;
      content: string;
      sourceProblem?: string;
      confidence?: number;
    }
  ): Promise<UserMemoryData | null> {
    const trimmed = data.content.trim();
    if (!trimmed) return null;

    // Check for duplicate or near-identical memory
    const existing = await prisma.userMemory.findFirst({
      where: {
        userId,
        content: {
          contains: trimmed.substring(0, 40),
        },
      },
    });

    if (existing) {
      // Update existing timestamp & source problem
      const updated = await prisma.userMemory.update({
        where: { id: existing.id },
        data: {
          category: data.category,
          sourceProblem: data.sourceProblem || existing.sourceProblem,
          updatedAt: new Date(),
        },
      });
      return {
        id: updated.id,
        userId: updated.userId,
        category: updated.category as MemoryCategory,
        content: updated.content,
        sourceProblem: updated.sourceProblem,
        confidence: updated.confidence,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    const created = await prisma.userMemory.create({
      data: {
        userId,
        category: data.category,
        content: trimmed,
        sourceProblem: data.sourceProblem,
        confidence: data.confidence ?? 1.0,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      category: created.category as MemoryCategory,
      content: created.content,
      sourceProblem: created.sourceProblem,
      confidence: created.confidence,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Delete a specific memory by ID.
   */
  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    const deleted = await prisma.userMemory.deleteMany({
      where: { id: memoryId, userId },
    });
    return deleted.count > 0;
  }

  /**
   * Clear all memories for a user.
   */
  async clearMemories(userId: string): Promise<number> {
    const result = await prisma.userMemory.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}

export const userRepository = new UserRepository();
