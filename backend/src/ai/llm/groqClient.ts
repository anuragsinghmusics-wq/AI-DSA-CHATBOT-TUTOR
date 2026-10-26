import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * LLM Client Factory — Using Gemini via ChatGoogleGenerativeAI.
 *
 * NOTE: This file is named groqClient.ts for historical reasons.
 */

/** Teacher LLM: generates pedagogical tutoring responses. Low temp for consistency. */
export function createTeacherLLM(): ChatGoogleGenerativeAI {
  logger.debug('Creating Teacher LLM (Gemini: gemini-3.6-flash)');
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    modelName: 'gemini-3.6-flash',
    temperature: 0.2,
    maxRetries: 2,
  });
}

/** Judge LLM: deterministically checks if a response leaks a full solution. */
export function createJudgeLLM(): ChatGoogleGenerativeAI {
  logger.debug('Creating Judge LLM (Gemini: gemini-3.6-flash)');
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    modelName: 'gemini-3.6-flash',
    temperature: 0,
    maxRetries: 2,
  });
}

/** Intent Classifier LLM: classifies user messages into allowed/rejected/off-topic. */
export function createIntentClassifierLLM(): ChatGoogleGenerativeAI {
  logger.debug('Creating Intent Classifier LLM (Gemini: gemini-3.6-flash)');
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    modelName: 'gemini-3.6-flash',
    temperature: 0,
    maxRetries: 2,
  });
}

/** Memory Reflection LLM: analyzes chat sessions in background to extract learner insights and habits. */
export function createMemoryReflectionLLM(): ChatGoogleGenerativeAI {
  logger.debug('Creating Memory Reflection LLM (Gemini: gemini-3.6-flash)');
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    modelName: 'gemini-3.6-flash',
    temperature: 0.1,
    maxRetries: 2,
  });
}

