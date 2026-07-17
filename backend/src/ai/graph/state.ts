import { Annotation } from '@langchain/langgraph';
import {
  Difficulty,
  type ProblemContext,
  type ChatMessageData,
  type SafetyResult,
  type JudgeResult,
  type Intent,
} from '../../types/index.js';

/**
 * LangGraph State Definition.
 * Defines the shared state that flows through all nodes in the pipeline.
 * Uses Annotation with reducers for proper state management.
 */
export const TutorGraphState = Annotation.Root({
  // Input
  userMessage: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  problemContext: Annotation<ProblemContext>({
    reducer: (_prev, next) => next,
    default: () => ({
      id: '',
      title: '',
      description: '',
      constraints: [] as string[],
      examples: [] as ProblemContext['examples'],
      difficulty: Difficulty.EASY,
      tags: [] as string[],
    }),
  }),
  chatHistory: Annotation<ChatMessageData[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // Pipeline stages
  intent: Annotation<Intent>({
    reducer: (_prev, next) => next,
    default: () => 'concept' as Intent,
  }),
  constructedPrompt: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  ragContext: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  isRefusalMode: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  teacherResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  safetyResult: Annotation<SafetyResult>({
    reducer: (_prev, next) => next,
    default: () => ({ safe: true, violations: [] }),
  }),
  judgeResult: Annotation<JudgeResult>({
    reducer: (_prev, next) => next,
    default: () => ({ approved: true, reason: '' }),
  }),

  // Output
  finalResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  error: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
});

export type TutorGraphStateType = typeof TutorGraphState.State;
