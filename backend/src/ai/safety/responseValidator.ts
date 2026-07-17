import { runRegexFilter } from './regexFilter.js';
import { detectCode } from './codeDetector.js';
import type { SafetyResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Response Validator — combines regex filter and code detector
 * for comprehensive safety analysis.
 */
export function validateResponse(text: string): SafetyResult {
  const regexResult = runRegexFilter(text);
  const heuristicResult = detectCode(text);

  const allViolations = [
    ...regexResult.violations.map((v) => `[Regex] ${v}`),
    ...heuristicResult.violations.map((v) => `[Heuristic] ${v}`),
  ];

  const isSafe = regexResult.safe && heuristicResult.safe;

  if (!isSafe) {
    logger.warn('Safety violations detected', {
      totalViolations: allViolations.length,
      violations: allViolations,
    });
  }

  return {
    safe: isSafe,
    violations: allViolations,
  };
}
