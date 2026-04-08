import path from 'path';
import type { Roadmap } from '@/types/topic';
import { readJSON, writeJSON, getTopicDir } from './fileUtils';

export async function getRoadmap(topicId: string): Promise<Roadmap | null> {
  const roadmapPath = path.join(getTopicDir(topicId), 'roadmap.json');
  return readJSON<Roadmap>(roadmapPath);
}

export async function saveRoadmap(
  topicId: string,
  roadmap: Roadmap
): Promise<void> {
  const roadmapPath = path.join(getTopicDir(topicId), 'roadmap.json');
  await writeJSON(roadmapPath, roadmap);
}

export interface DiagnosisData {
  level: 'beginner' | 'intermediate' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  summary: string;
  completedAt: string;
}

export async function getDiagnosis(
  topicId: string
): Promise<DiagnosisData | null> {
  const diagnosisPath = path.join(getTopicDir(topicId), 'diagnosis.json');
  return readJSON<DiagnosisData>(diagnosisPath);
}

export async function saveDiagnosis(
  topicId: string,
  diagnosis: DiagnosisData
): Promise<void> {
  const diagnosisPath = path.join(getTopicDir(topicId), 'diagnosis.json');
  await writeJSON(diagnosisPath, diagnosis);
}

/**
 * 최근 테스트 결과를 기반으로 수준을 자동 조정합니다.
 *
 * 승급 조건:
 *   beginner → intermediate: 최근 2회 연속 80%+
 *   intermediate → advanced: 최근 2회 연속 90%+
 *
 * 강등 조건:
 *   advanced → intermediate: 최근 2회 연속 60% 미만
 *   intermediate → beginner: 최근 2회 연속 50% 미만
 */
export async function updateLevelFromTestResults(
  topicId: string,
  latestScore: number,
  latestMaxScore: number
): Promise<{ changed: boolean; oldLevel?: string; newLevel?: string }> {
  const diagnosis = await getDiagnosis(topicId);
  if (!diagnosis) return { changed: false };

  // 최근 테스트 점수 이력 가져오기 (growth.json의 testScoreHistory)
  const growthPath = path.join(getTopicDir(topicId), 'growth.json');
  const growth = await readJSON<{
    testScoreHistory: Array<{ date: string; score: number; maxScore: number }>;
  }>(growthPath);

  if (!growth?.testScoreHistory || growth.testScoreHistory.length < 1) {
    return { changed: false };
  }

  // 최근 2회: growth에 이미 기록된 최신 1회 + 현재 저장 중인 1회
  const history = growth.testScoreHistory;
  const prevEntry = history[history.length - 1];
  const prevPct = prevEntry.score / prevEntry.maxScore;
  const currentPct = latestMaxScore > 0 ? latestScore / latestMaxScore : 0;

  const scores = [prevPct, currentPct];
  const allAbove = (threshold: number) => scores.every(s => s >= threshold);
  const allBelow = (threshold: number) => scores.every(s => s < threshold);

  const oldLevel = diagnosis.level;
  let newLevel = oldLevel;

  // 승급
  if (oldLevel === 'beginner' && allAbove(0.8)) {
    newLevel = 'intermediate';
  } else if (oldLevel === 'intermediate' && allAbove(0.9)) {
    newLevel = 'advanced';
  }

  // 강등
  if (oldLevel === 'advanced' && allBelow(0.6)) {
    newLevel = 'intermediate';
  } else if (oldLevel === 'intermediate' && allBelow(0.5)) {
    newLevel = 'beginner';
  }

  if (newLevel !== oldLevel) {
    diagnosis.level = newLevel;
    await saveDiagnosis(topicId, diagnosis);
    return { changed: true, oldLevel, newLevel };
  }

  return { changed: false };
}
