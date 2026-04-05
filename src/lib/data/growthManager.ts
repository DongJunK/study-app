import path from 'path';
import { readJSON, writeJSON, getTopicDir, ensureDir, listDirs } from './fileUtils';
import { getTopic } from './topicManager';
import { getTestResults } from './testManager';

export interface ProgressEntry {
  date: string;
  progress: number;
}

export interface TestScoreEntry {
  date: string;
  score: number;
  maxScore: number;
}

export interface WeaknessChangeEntry {
  date: string;
  concept: string;
  from: string;
  to: string;
}

export interface GrowthData {
  topicId: string;
  topicName: string;
  progressHistory: ProgressEntry[];
  testScoreHistory: TestScoreEntry[];
  weaknessChanges: WeaknessChangeEntry[];
  totalSessionMinutes: number;
  currentStreak: number;
}

interface GrowthFileData {
  progressHistory: ProgressEntry[];
  testScoreHistory: TestScoreEntry[];
  weaknessChanges: WeaknessChangeEntry[];
  totalSessionMinutes: number;
  streakDates: string[]; // ISO date strings (YYYY-MM-DD) for streak calculation
}

const GROWTH_FILE = 'growth.json';

function getGrowthFilePath(topicId: string): string {
  return path.join(getTopicDir(topicId), GROWTH_FILE);
}

function getDefaultGrowthFileData(): GrowthFileData {
  return {
    progressHistory: [],
    testScoreHistory: [],
    weaknessChanges: [],
    totalSessionMinutes: 0,
    streakDates: [],
  };
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDates = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  // Check if the most recent date is today or yesterday
  const mostRecent = uniqueDates[0];
  const diffFromToday = Math.floor(
    (new Date(today).getTime() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function readGrowthFile(topicId: string): Promise<GrowthFileData> {
  const data = await readJSON<GrowthFileData>(getGrowthFilePath(topicId));
  return data ?? getDefaultGrowthFileData();
}

async function writeGrowthFile(topicId: string, data: GrowthFileData): Promise<void> {
  await writeJSON(getGrowthFilePath(topicId), data);
}

export async function getGrowthData(topicId: string): Promise<GrowthData | null> {
  const topic = await getTopic(topicId);
  if (!topic) return null;

  const fileData = await readGrowthFile(topicId);

  return {
    topicId,
    topicName: topic.name,
    progressHistory: fileData.progressHistory,
    testScoreHistory: fileData.testScoreHistory,
    weaknessChanges: fileData.weaknessChanges,
    totalSessionMinutes: fileData.totalSessionMinutes,
    currentStreak: calculateStreak(fileData.streakDates),
  };
}

export async function getAllGrowthData(): Promise<GrowthData[]> {
  const topicsDir = path.join(process.cwd(), 'data', 'topics');
  const dirs = await listDirs(topicsDir);

  const results: GrowthData[] = [];
  for (const dir of dirs) {
    const data = await getGrowthData(dir);
    if (data) {
      // Only include topics that have some growth data
      const hasData =
        data.progressHistory.length > 0 ||
        data.testScoreHistory.length > 0 ||
        data.weaknessChanges.length > 0 ||
        data.totalSessionMinutes > 0;
      if (hasData) {
        results.push(data);
      }
    }
  }

  return results;
}

export async function recordProgressChange(
  topicId: string,
  progress: number
): Promise<void> {
  const fileData = await readGrowthFile(topicId);
  const today = new Date().toISOString().split('T')[0];

  const existingIndex = fileData.progressHistory.findIndex(p => p.date === today);
  if (existingIndex >= 0) {
    fileData.progressHistory[existingIndex].progress = progress;
  } else {
    fileData.progressHistory.push({ date: today, progress });
  }

  // Add today to streak dates
  if (!fileData.streakDates.includes(today)) {
    fileData.streakDates.push(today);
  }

  await writeGrowthFile(topicId, fileData);
}

export async function recordTestScore(
  topicId: string,
  score: number,
  maxScore: number
): Promise<void> {
  const fileData = await readGrowthFile(topicId);
  const today = new Date().toISOString().split('T')[0];

  fileData.testScoreHistory.push({
    date: today,
    score,
    maxScore,
  });

  // Add today to streak dates
  if (!fileData.streakDates.includes(today)) {
    fileData.streakDates.push(today);
  }

  await writeGrowthFile(topicId, fileData);
}

export async function recordWeaknessChange(
  topicId: string,
  concept: string,
  from: string,
  to: string
): Promise<void> {
  const fileData = await readGrowthFile(topicId);
  const today = new Date().toISOString().split('T')[0];

  fileData.weaknessChanges.push({
    date: today,
    concept,
    from,
    to,
  });

  await writeGrowthFile(topicId, fileData);
}

export async function recordSessionMinutes(
  topicId: string,
  minutes: number
): Promise<void> {
  const fileData = await readGrowthFile(topicId);
  const today = new Date().toISOString().split('T')[0];

  fileData.totalSessionMinutes += minutes;

  if (!fileData.streakDates.includes(today)) {
    fileData.streakDates.push(today);
  }

  await writeGrowthFile(topicId, fileData);
}
