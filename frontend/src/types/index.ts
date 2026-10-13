// ============================
// Frontend TypeScript Types
// ============================

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemContext {
  id: string;
  title: string;
  description: string;
  constraints: string[];
  examples: ProblemExample[];
  difficulty: Difficulty;
  tags: string[];
  companies?: string[];
  category?: string;
  acceptanceRate?: number;
  likes?: number;
  dislikes?: number;
  /** Map of language slug → starter function snippet (from LeetCode) */
  codeSnippets?: Record<string, string>;
  /** Raw example test cases string from LeetCode */
  exampleTestcases?: string;
}

export interface ProblemListItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  companies?: string[];
}

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  intent?: string;
  wasSafe?: boolean;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  messages: Message[];
}

export interface FeedbackRequest {
  messageId: string;
  rating: number;
  comment?: string;
}

export interface SSEEvent {
  type: 'token' | 'done' | 'error' | 'metadata';
  data: string;
}
