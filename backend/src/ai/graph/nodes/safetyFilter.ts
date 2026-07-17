import { validateResponse } from '../../safety/responseValidator.js';
import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';

/**
 * Node 5: Safety Filter
 * Runs multi-layer regex + heuristic analysis on the teacher's response.
 * Catches code patterns that the LLM might have generated despite instructions.
 *
 * Design: The regex/heuristic filters are intentionally over-sensitive and flag
 * false positives (e.g., code mentioned in an explanation). They pass the result
 * to the Judge LLM which makes the final authoritative decision. However, the
 * actual violations are preserved in safetyResult.violations so they are
 * accurately stored in the database's wasSafe field.
 */
export async function safetyFilterNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('🛡️ Safety Filter: Scanning response for code patterns...');

  if (!state.teacherResponse) {
    return {
      safetyResult: { safe: false, violations: ['Empty teacher response'] },
    };
  }

  const safetyResult = validateResponse(state.teacherResponse);

  if (safetyResult.safe) {
    logger.info('✅ Safety filter passed — no code patterns detected');
  } else {
    logger.warn('⚠️ Safety filter flagged patterns — deferring final decision to Judge LLM', {
      violationCount: safetyResult.violations.length,
      violations: safetyResult.violations.slice(0, 5), // log first 5 only
    });
    // ✅ FIX: Preserve the real violations in the result for DB storage accuracy,
    // but override safe=true so the Judge LLM (which allows small code snippets
    // and pseudocode) makes the final call. This prevents false positives from
    // blocking legitimate teaching responses.
    return {
      safetyResult: {
        safe: true, // pass-through to Judge LLM for final verdict
        violations: safetyResult.violations, // preserve for DB / audit trail
      },
    };
  }

  return { safetyResult };
}
