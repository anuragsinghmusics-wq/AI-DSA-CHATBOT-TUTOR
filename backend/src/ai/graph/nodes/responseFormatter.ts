import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';

/**
 * Node 7: Response Formatter
 * Formats the final approved response for delivery to the user.
 * Ensures clean markdown formatting.
 */
export async function responseFormatterNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('✨ Response Formatter: Preparing final response...');

  let finalResponse = state.teacherResponse;

  // Clean up any double newlines or excessive whitespace
  finalResponse = finalResponse
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Ensure the response doesn't start with a generic greeting
  // (the LLM sometimes adds unnecessary preamble)
  const greetingPatterns = [
    /^(Sure!|Of course!|Absolutely!|Great question!|That's a great question!)\s*/i,
  ];
  for (const pattern of greetingPatterns) {
    finalResponse = finalResponse.replace(pattern, '');
  }

  logger.info('✅ Response formatted', {
    finalLength: finalResponse.length,
  });

  return { finalResponse };
}
