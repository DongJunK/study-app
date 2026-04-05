import path from 'path';
import { getTopicDir, readJSON, writeJSON, ensureDir } from './fileUtils';
import type { Weakness, WeaknessStatus } from '@/types/weakness';

function getWeaknessFilePath(topicId: string): string {
  return path.join(getTopicDir(topicId), 'weaknesses.json');
}

export async function getWeaknesses(topicId: string): Promise<Weakness[]> {
  const filePath = getWeaknessFilePath(topicId);
  const data = await readJSON<Weakness[]>(filePath);
  return data || [];
}

export async function saveWeaknesses(topicId: string, weaknesses: Weakness[]): Promise<void> {
  const filePath = getWeaknessFilePath(topicId);
  await ensureDir(path.dirname(filePath));
  await writeJSON(filePath, weaknesses);
}

export async function updateWeaknessStatus(
  topicId: string,
  weaknessId: string,
  status: WeaknessStatus
): Promise<void> {
  const weaknesses = await getWeaknesses(topicId);
  const index = weaknesses.findIndex((w) => w.id === weaknessId);
  if (index === -1) return;

  weaknesses[index] = {
    ...weaknesses[index],
    status,
    lastUpdated: new Date().toISOString(),
  };

  await saveWeaknesses(topicId, weaknesses);
}

export async function addWeakness(
  topicId: string,
  weakness: Omit<Weakness, 'id'>
): Promise<Weakness> {
  const weaknesses = await getWeaknesses(topicId);
  const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newWeakness: Weakness = { ...weakness, id, detectedCount: weakness.detectedCount ?? 1 };
  weaknesses.push(newWeakness);
  await saveWeaknesses(topicId, weaknesses);
  return newWeakness;
}

export async function classifyWeaknesses(
  topicId: string,
  newWeaknesses: Array<{ concept: string; status: WeaknessStatus }>
): Promise<void> {
  const existing = await getWeaknesses(topicId);
  const now = new Date().toISOString();

  for (const nw of newWeaknesses) {
    const existingIndex = existing.findIndex(
      (e) => e.concept.toLowerCase() === nw.concept.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Re-detected weakness: increment count + update status
      const prev = existing[existingIndex];
      existing[existingIndex] = {
        ...prev,
        status: nw.status,
        detectedCount: (prev.detectedCount || 1) + 1,
        lastUpdated: now,
      };
    } else {
      // New weakness
      const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      existing.push({
        id,
        topicId,
        concept: nw.concept,
        status: nw.status,
        detectedCount: 1,
        firstDetected: now,
        lastUpdated: now,
        testHistory: [],
      });
    }
  }

  await saveWeaknesses(topicId, existing);
}
