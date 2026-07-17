import { ChatOpenAI } from '@langchain/openai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * LLM Client Factory — Using OpenRouter via ChatOpenAI.
 *
 * NOTE: This file is named groqClient.ts for historical reasons.
 */

/** Teacher LLM: generates pedagogical tutoring responses. Low temp for consistency. */
export function createTeacherLLM(): ChatOpenAI {
  logger.debug('Creating Teacher LLM (OpenRouter: google/gemini-2.5-flash)');
  return new ChatOpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
    modelName: 'google/gemini-2.5-flash',
    temperature: 0.2,
    maxRetries: 2,
    maxTokens: 2048,
  });
}

/** Judge LLM: deterministically checks if a response leaks a full solution. */
export function createJudgeLLM(): ChatOpenAI {
  logger.debug('Creating Judge LLM (OpenRouter: google/gemini-2.5-flash)');
  return new ChatOpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
    modelName: 'google/gemini-2.5-flash',
    temperature: 0,
    maxRetries: 2,
    maxTokens: 2048,
  });
}

/** Intent Classifier LLM: classifies user messages into allowed/rejected/off-topic. */
export function createIntentClassifierLLM(): ChatOpenAI {
  logger.debug('Creating Intent Classifier LLM (OpenRouter: google/gemini-2.5-flash)');
  return new ChatOpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
    modelName: 'google/gemini-2.5-flash',
    temperature: 0,
    maxRetries: 2,
    maxTokens: 2048,
  });
}
