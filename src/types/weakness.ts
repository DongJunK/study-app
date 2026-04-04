export type WeaknessStatus = 'unknown' | 'confused' | 'understood';

export interface Weakness {
  id: string;
  topicId: string;
  concept: string;
  status: WeaknessStatus;
  firstDetected: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  testHistory: Array<{
    date: string;
    score: number;
    passed: boolean;
  }>;
}
