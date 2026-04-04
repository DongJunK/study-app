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
