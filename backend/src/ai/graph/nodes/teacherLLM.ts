import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createTeacherLLM } from '../../llm/groqClient.js';
import { buildSystemPrompt } from '../../prompts/system.prompt.js';
import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';

const teacherLLM = createTeacherLLM();

/**
 * Node 4: Teacher LLM
 * Invokes the main Gemini 2.5 Flash model with the constructed prompt.
 * Uses the strict system prompt to generate a teaching response.
 */
export async function teacherLLMNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('🎓 Teacher LLM: Generating tutoring response...');

  try {
    const response = await teacherLLM.invoke([
      new SystemMessage(buildSystemPrompt(state.problemContext)),
      new HumanMessage(state.constructedPrompt),
    ]);

    let teacherResponse = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Strip any <think>...</think> blocks from Qwen3 thinking mode
    teacherResponse = teacherResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    logger.info('✅ Teacher response generated', {
      responseLength: teacherResponse.length,
    });

    return { teacherResponse };
  } catch (error) {
    logger.error('Teacher LLM error', { error });
    return {
      teacherResponse: '',
      error: `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
