export type WeaknessStatus = 'unknown' | 'confused' | 'understood';

export interface Weakness {
  id: string;
  topicId: string;
  concept: string;
  status: WeaknessStatus;
  detectedCount: number; // 약점으로 감지된 횟수 (높을수록 더 약한 개념)
  firstDetected: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  testHistory: Array<{
    date: string;
    score: number;
    passed: boolean;
  }>;
}
