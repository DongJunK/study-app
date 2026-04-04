import path from 'path';
import { getTopicDir, readJSON, writeJSON, ensureDir } from './fileUtils';
import type { TestResult } from '@/types/test';

function getTestsDir(topicId: string): string {
  return path.join(getTopicDir(topicId), 'tests');
}

function getTestFilePath(topicId: string, testId: string): string {
  return path.join(getTestsDir(topicId), `${testId}.json`);
}

function getQnAFilePath(topicId: string): string {
  return path.join(getTopicDir(topicId), 'qna.json');
}

export async function saveTestResult(topicId: string, result: TestResult): Promise<void> {
  const filePath = getTestFilePath(topicId, result.id);
  await writeJSON(filePath, result);
}

export async function getTestResults(topicId: string): Promise<TestResult[]> {
  const testsDir = getTestsDir(topicId);
  await ensureDir(testsDir);

  const fs = await import('fs/promises');
  try {
    const entries = await fs.readdir(testsDir);
    const jsonFiles = entries.filter((e) => e.endsWith('.json'));

    const results: TestResult[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(testsDir, file);
      const data = await readJSON<TestResult>(filePath);
      if (data) results.push(data);
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getLatestTestResult(topicId: string): Promise<TestResult | null> {
  const results = await getTestResults(topicId);
  return results.length > 0 ? results[0] : null;
}

export async function saveModelAnswer(
  topicId: string,
  questionIndex: number,
  answer: string
): Promise<void> {
  const testsDir = getTestsDir(topicId);
  const filePath = path.join(testsDir, 'model-answers.json');
  const existing = (await readJSON<Record<string, string>>(filePath)) || {};
  existing[String(questionIndex)] = answer;
  await writeJSON(filePath, existing);
}

interface QnAEntry {
  question: string;
  answer: string;
  timestamp: string;
}

export async function saveFollowUpQnA(
  topicId: string,
  testId: string,
  qna: { question: string; answer: string }
): Promise<void> {
  const filePath = getQnAFilePath(topicId);
  const existing = (await readJSON<Record<string, QnAEntry[]>>(filePath)) || {};
  if (!existing[testId]) existing[testId] = [];
  existing[testId].push({
    ...qna,
    timestamp: new Date().toISOString(),
  });
  await writeJSON(filePath, existing);
}
