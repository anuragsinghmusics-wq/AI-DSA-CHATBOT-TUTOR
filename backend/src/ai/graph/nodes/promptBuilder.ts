import { buildTeacherPrompt, buildRefusalPrompt } from '../../prompts/teacher.prompt.js';
import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';

/**
 * Node 2: Prompt Builder
 * Constructs the full prompt by combining the system prompt,
 * problem context, chat history, RAG context, and user question.
 * When isRefusalMode is true, builds a refusal-specific prompt so
 * the Teacher LLM generates a natural tutoring refusal, not a template.
 */
export async function promptBuilderNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('📝 Prompt Builder: Constructing prompt...');

  const constructedPrompt = state.isRefusalMode
    ? buildRefusalPrompt(state.problemContext, state.chatHistory, state.userMessage)
    : buildTeacherPrompt(
        state.problemContext,
        state.chatHistory,
        state.userMessage,
        state.ragContext
      );

  logger.debug('Prompt constructed', {
    promptLength: constructedPrompt.length,
    isRefusalMode: state.isRefusalMode,
    hasRagContext: state.ragContext.length > 0,
    historyLength: state.chatHistory.length,
  });

  return { constructedPrompt };
}
