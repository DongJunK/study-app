export type LearningMode = 'basic' | 'socratic' | 'feynman';
export type ContentFormat = 'text' | 'code' | 'diagram' | 'analogy';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface LearningSession {
  id: string;
  topicId: string;
  mode: LearningMode;
  formats: ContentFormat[];
  messages: Message[];
  startedAt: string;
  endedAt: string | null;
  summary: string | null;
  roadmapItemId: string | null;
  elapsedSeconds?: number;
  completed?: boolean;
}

export interface LastSession {
  topicId: string;
  sessionId: string;
  roadmapItemId: string | null;
  mode: LearningMode;
  resumeContext: string;
}
