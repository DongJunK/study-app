export type TestType = 'deep-learning' | 'multiple-choice' | 'short-answer';

export interface TestAnswer {
  questionIndex: number;
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  maxScore: number;
  passed: boolean;
  feedback: string;
}

export interface TestResult {
  id: string;
  topicId: string;
  type: TestType;
  duration: number; // minutes
  answers: TestAnswer[];
  totalScore: number;
  maxTotalScore: number;
  passThreshold: number;
  passed: boolean;
  level?: string;
  createdAt: string;
  followUpQnA: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}
