import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createIntentClassifierLLM } from '../../llm/groqClient.js';
import {
  INTENT_CLASSIFICATION_PROMPT,
  buildIntentClassificationMessage,
} from '../../prompts/intent.prompt.js';
import { Intent } from '../../../types/index.js';
import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';

const classifierLLM = createIntentClassifierLLM();

/**
 * Node 1: Intent Classifier
 * Classifies the user's message into an allowed or rejected intent.
 * Uses a dedicated low-temperature LLM for deterministic classification.
 */
export async function intentClassifierNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('🔍 Intent Classifier: Classifying user message...');

  try {
    const response = await classifierLLM.invoke([
      new SystemMessage(INTENT_CLASSIFICATION_PROMPT),
      new HumanMessage(buildIntentClassificationMessage(state.userMessage)),
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      logger.warn('Intent classifier returned non-JSON response, defaulting to concept', {
        response: responseText,
      });
      return { intent: Intent.CONCEPT };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const intent = parsed.intent as Intent;

    // Validate the intent value
    const validIntents = Object.values(Intent);
    if (!validIntents.includes(intent)) {
      logger.warn('Unknown intent returned, defaulting to concept', { intent });
      return { intent: Intent.CONCEPT };
    }

    logger.info('✅ Intent classified', {
      intent,
      confidence: parsed.confidence,
      reason: parsed.reason,
    });

    return { intent };
  } catch (error) {
    logger.error('Intent classifier error', { error });
    // Default to concept on error — better to attempt a response than block
    return { intent: Intent.CONCEPT };
  }
}
