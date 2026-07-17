// ============================
// Shared TypeScript Types
// ============================

// ---------- Enums ----------

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export enum Intent {
  CONCEPT = 'concept',
  COMPLEXITY = 'complexity',
  DRY_RUN = 'dryrun',
  VISUALIZATION = 'visualization',
  DEBUGGING = 'debugging',
  THEORY = 'theory',
  CODE_REVIEW = 'code_review',
  REJECTED = 'rejected',
  OFF_TOPIC = 'off_topic',
}

// ---------- Problem ----------

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

// ---------- Chat ----------

export interface ChatMessageData {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  intent?: string;
  wasSafe: boolean;
  createdAt: Date;
}

export interface ChatSessionData {
  id: string;
  userId: string;
  problemId: string;
  messages: ChatMessageData[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------- API Request/Response ----------

export interface ChatRequest {
  sessionId?: string;
  problemId?: string;
  message: string;
  problemContext: ProblemContext;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessageData[];
}

export interface FeedbackRequest {
  messageId: string;
  rating: number;
  comment?: string;
}

// ---------- LangGraph State ----------

export interface SafetyResult {
  safe: boolean;
  violations: string[];
}

export interface JudgeResult {
  approved: boolean;
  reason: string;
}

export interface GraphState {
  userMessage: string;
  problemContext: ProblemContext;
  chatHistory: ChatMessageData[];
  intent: Intent;
  constructedPrompt: string;
  ragContext: string;
  teacherResponse: string;
  safetyResult: SafetyResult;
  judgeResult: JudgeResult;
  finalResponse: string;
  error?: string;
}

// ---------- SSE Event ----------

export interface SSEEvent {
  type: 'token' | 'done' | 'error' | 'metadata';
  data: string;
  messageId?: string;
}
