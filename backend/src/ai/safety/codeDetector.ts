import type { SafetyResult } from '../../types/index.js';

/**
 * Advanced code detection using heuristic analysis.
 * Complements the regex filter with structural analysis.
 */

/**
 * Analyzes text for code-like structural patterns.
 */
export function detectCode(text: string): SafetyResult {
  const violations: string[] = [];

  // 1. Check for high density of semicolons (code indicator)
  const lines = text.split('\n');
  const semicolonLines = lines.filter((line) => line.trim().endsWith(';')).length;
  const semicolonRatio = semicolonLines / Math.max(lines.length, 1);
  if (semicolonRatio > 0.3 && semicolonLines > 2) {
    violations.push(`High semicolon density: ${semicolonLines}/${lines.length} lines end with semicolons`);
  }

  // 2. Check for indentation patterns typical of code
  const indentedLines = lines.filter((line) => /^\s{2,}[\w{}\[\](]/.test(line)).length;
  const indentRatio = indentedLines / Math.max(lines.length, 1);
  if (indentRatio > 0.4 && indentedLines > 3) {
    violations.push(`Code-like indentation detected: ${indentedLines}/${lines.length} lines have code-style indentation`);
  }

  // 3. Check for curly brace blocks (code structure)
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  if (openBraces > 3 && Math.abs(openBraces - closeBraces) <= 1) {
    violations.push(`Balanced curly braces detected: ${openBraces} pairs (likely code structure)`);
  }

  // 4. Check for arrow function patterns
  const arrowFunctions = (text.match(/=>\s*\{/g) || []).length;
  if (arrowFunctions > 0) {
    violations.push(`Arrow function syntax detected: ${arrowFunctions} occurrence(s)`);
  }

  // 5. Check for assignment chains (a = b = c pattern)
  const assignmentChains = (text.match(/\w+\s*=\s*\w+\s*=\s*\w+/g) || []).length;
  if (assignmentChains > 0) {
    violations.push(`Assignment chains detected: ${assignmentChains} occurrence(s)`);
  }

  // 6. Check for common code output patterns
  const printPatterns = (text.match(/(?:console\.log|System\.out|printf|print|cout)\s*\(/g) || []).length;
  if (printPatterns > 0) {
    violations.push(`Print/output statements detected: ${printPatterns} occurrence(s)`);
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}
