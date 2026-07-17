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
  category?: string;
  acceptanceRate?: number;
  likes?: number;
  dislikes?: number;
}

export interface ProblemListItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
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
