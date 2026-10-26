import { userRepository } from '../repositories/user.repository.js';
import { createMemoryReflectionLLM } from '../ai/llm/groqClient.js';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { logger } from '../utils/logger.js';
import type {
  UserProfileData,
  UserMemoryData,
  UpdateProfileRequest,
  CreateMemoryRequest,
  ChatMessageData,
  MemoryCategory,
} from '../types/index.js';

export class MemoryService {
  private reflectionLLM = createMemoryReflectionLLM();

  /**
   * Get user profile.
   */
  async getUserProfile(userId: string): Promise<UserProfileData> {
    return userRepository.getOrCreateProfile(userId);
  }

  /**
   * Update user profile preferences.
   */
  async updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfileData> {
    return userRepository.updateProfile(userId, data);
  }

  /**
   * Get all active long-term memories for a user.
   */
  async getUserMemories(userId: string, limit: number = 20): Promise<UserMemoryData[]> {
    return userRepository.getMemories(userId, limit);
  }

  /**
   * Add a manual memory note.
   */
  async addUserMemory(userId: string, data: CreateMemoryRequest): Promise<UserMemoryData | null> {
    return userRepository.addMemory(userId, data);
  }

  /**
   * Delete a specific memory.
   */
  async deleteUserMemory(memoryId: string, userId: string): Promise<boolean> {
    return userRepository.deleteMemory(memoryId, userId);
  }

  /**
   * Clear all memories for a user.
   */
  async clearUserMemories(userId: string): Promise<number> {
    return userRepository.clearMemories(userId);
  }

  /**
   * Asynchronously analyze a tutoring session and extract durable learning memories.
   * Runs in the background without blocking the user response.
   */
  async reflectAndStoreMemory(
    userId: string,
    problemTitle: string,
    chatHistory: ChatMessageData[],
    userCode?: string
  ): Promise<void> {
    try {
      // Reflect if there is at least 1 student message
      const userMessages = chatHistory.filter((m) => m.role === 'USER');
      if (userMessages.length < 1) {
        logger.debug('Skipping memory reflection — no user messages');
        return;
      }

      // Load existing memories so the LLM doesn't extract duplicates
      const existingMemories = await userRepository.getMemories(userId, 10);
      const existingSummary = existingMemories.length > 0
        ? existingMemories.map((m) => `- [${m.category}] ${m.content}`).join('\n')
        : 'None recorded yet.';

      const conversationText = chatHistory
        .slice(-8)
        .map((m) => `${m.role === 'USER' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const systemPrompt = `You are an expert DSA Pedagogy Analyst.
Your goal is to extract durable, high-value Long-Term Memory insights and learner profile facts about this student to personalize future tutoring sessions across different problems.

Analyze the conversation on problem "${problemTitle}". Identify 0 to 3 new, specific observations about the student:
1. LEARNING_STYLE: Personal identity facts, learning style, preferences, or goals. Examples:
   - "Student's name is Harsh"
   - "Student is preparing for Google/FAANG interviews"
   - "Prefers concrete dry runs with numbers rather than abstract formulas"
   - "Prefers Python syntax over C++"
2. WEAKNESS: A recurring misconception, logical trap, or edge-case blindness (e.g., "Often forgets base condition in recursion", "Struggles with off-by-one errors in binary search").
3. STRENGTH: A pattern, data structure, or technique the student demonstrated solid grasp of.
4. MILESTONE: An optimal solution or key insight the student reached on their own.

STRICT RULES:
- If the student stated their name or identity in this conversation, YOU MUST extract it as a LEARNING_STYLE memory (e.g., "Student's name is Harsh").
- Do NOT repeat or duplicate existing memories listed below.
- Keep each observation crisp, specific, and actionable for a tutor (1 sentence max).
- If the student did not demonstrate any notable fact, strength, weakness, or milestone, return an empty array [].
- Output MUST be valid JSON array with objects matching: [{"category": "WEAKNESS" | "STRENGTH" | "LEARNING_STYLE" | "MILESTONE", "content": "..."}]`;

      const humanPrompt = `## EXISTING MEMORIES ALREADY RECORDED FOR THIS STUDENT:
${existingSummary}

## RECENT CONVERSATION (Problem: ${problemTitle}):
${conversationText}

${userCode ? `## STUDENT'S SUBMITTED CODE:\n\`\`\`\n${userCode.slice(0, 1000)}\n\`\`\`\n` : ''}

Output strictly the JSON array (no markdown code blocks, no other text):`;

      const response = await this.reflectionLLM.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt),
      ]);

      const raw = typeof response.content === 'string'
        ? response.content.trim()
        : JSON.stringify(response.content);

      // Clean any potential markdown wrapping
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

      let extracted: Array<{ category: string; content: string }> = [];
      try {
        extracted = JSON.parse(cleaned);
      } catch (parseErr) {
        logger.debug('Could not parse memory reflection output as JSON', { raw, error: parseErr });
        return;
      }

      if (!Array.isArray(extracted) || extracted.length === 0) {
        logger.debug('Memory reflection returned no new insights');
        return;
      }

      for (const item of extracted) {
        if (!item.content || typeof item.content !== 'string') continue;
        const validCategories: MemoryCategory[] = ['WEAKNESS', 'STRENGTH', 'LEARNING_STYLE', 'MILESTONE'];
        const category = validCategories.includes(item.category as MemoryCategory)
          ? (item.category as MemoryCategory)
          : 'WEAKNESS';

        const added = await userRepository.addMemory(userId, {
          category,
          content: item.content.trim(),
          sourceProblem: problemTitle,
          confidence: 0.9,
        });

        if (added) {
          logger.info('🧠 New Long-Term Memory stored', {
            userId,
            category: added.category,
            content: added.content,
            sourceProblem: problemTitle,
          });

          // If a student name was extracted in memory, also update user's profile name in DB
          const nameMatch = added.content.match(/(?:student's name is|name is|called)\s+([a-zA-Z]+)/i);
          if (nameMatch && nameMatch[1]) {
            const rawName = nameMatch[1].trim();
            const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            await userRepository.updateProfile(userId, { name: formattedName });
            logger.info('👤 User profile name updated from memory reflection', { userId, name: formattedName });
          }
        }
      }
    } catch (err) {
      // Memory reflection is background work; failure must never crash the server
      logger.error('Error during memory reflection', { error: err });
    }
  }
}

export const memoryService = new MemoryService();
