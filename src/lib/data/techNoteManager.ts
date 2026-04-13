import path from 'path';
import fs from 'fs/promises';
import { getTopicDir, readJSON, writeJSON, readMarkdown, writeMarkdown, ensureDir } from './fileUtils';
import type { TechNote, TechNoteMeta, NoteSource } from '@/types/technote';
import type { LearningSession } from '@/types/session';
import type { TestResult } from '@/types/test';
import type { DiagnosisData } from './roadmapManager';

function getTechNotesDir(topicId: string): string {
  return path.join(getTopicDir(topicId), 'technotes');
}

function getMetaPath(topicId: string): string {
  return path.join(getTechNotesDir(topicId), 'meta.json');
}

function getNotePath(topicId: string, noteId: string): string {
  return path.join(getTechNotesDir(topicId), `${noteId}.md`);
}

export async function getTechNotes(topicId: string): Promise<TechNote[]> {
  const meta = await readJSON<TechNoteMeta>(getMetaPath(topicId));
  if (!meta) return [];
  return meta.notes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getTechNoteContent(topicId: string, noteId: string): Promise<string | null> {
  return readMarkdown(getNotePath(topicId, noteId));
}

export async function saveTechNote(
  topicId: string,
  note: TechNote,
  markdown: string
): Promise<void> {
  const dir = getTechNotesDir(topicId);
  await ensureDir(dir);

  // Save markdown file
  await writeMarkdown(getNotePath(topicId, note.id), markdown);

  // Update meta.json
  const meta = (await readJSON<TechNoteMeta>(getMetaPath(topicId))) || { notes: [] };
  meta.notes.push(note);
  await writeJSON(getMetaPath(topicId), meta);
}

export async function deleteTechNote(topicId: string, noteId: string): Promise<void> {
  // Remove markdown file
  try {
    await fs.unlink(getNotePath(topicId, noteId));
  } catch { /* file may not exist */ }

  // Update meta.json
  const meta = await readJSON<TechNoteMeta>(getMetaPath(topicId));
  if (meta) {
    meta.notes = meta.notes.filter((n) => n.id !== noteId);
    await writeJSON(getMetaPath(topicId), meta);
  }
}

export async function getAvailableSources(topicId: string): Promise<NoteSource[]> {
  const topicDir = getTopicDir(topicId);

  // Get existing note sourceIds
  const meta = await readJSON<TechNoteMeta>(getMetaPath(topicId));
  const usedSourceIds = new Set((meta?.notes || []).map((n) => n.sourceId));

  const sources: NoteSource[] = [];

  // Scan sessions
  const sessionsDir = path.join(topicDir, 'sessions');
  try {
    const sessionFiles = await fs.readdir(sessionsDir);
    for (const file of sessionFiles) {
      if (!file.endsWith('.json')) continue;
      const session = await readJSON<LearningSession>(path.join(sessionsDir, file));
      if (!session || usedSourceIds.has(session.id)) continue;
      // Only include completed sessions with content
      if (!session.summary && session.messages.length < 3) continue;
      sources.push({
        sourceType: 'session',
        sourceId: session.id,
        title: session.summary
          ? (typeof session.summary === 'string' ? session.summary.slice(0, 80) : '학습 세션')
          : `학습 세션 (${session.messages.length}개 메시지)`,
        date: session.startedAt,
      });
    }
  } catch { /* no sessions dir */ }

  // Scan tests
  const testsDir = path.join(topicDir, 'tests');
  try {
    const testFiles = await fs.readdir(testsDir);
    for (const file of testFiles) {
      if (!file.endsWith('.json') || file === 'model-answers.json') continue;
      const test = await readJSON<TestResult>(path.join(testsDir, file));
      if (!test || usedSourceIds.has(test.id)) continue;
      const typeLabel = test.type === 'multiple-choice' ? '객관식' : test.type === 'short-answer' ? '주관식' : '심화학습';
      const scoreLabel = `${test.totalScore}/${test.maxTotalScore}점`;
      sources.push({
        sourceType: 'test',
        sourceId: test.id,
        title: `${typeLabel} 테스트 (${scoreLabel})`,
        date: test.createdAt,
      });
    }
  } catch { /* no tests dir */ }

  // Scan diagnosis
  const diagnosisPath = path.join(topicDir, 'diagnosis.json');
  try {
    const diagnosis = await readJSON<DiagnosisData>(diagnosisPath);
    if (diagnosis && !usedSourceIds.has('diagnosis')) {
      const levelLabel = diagnosis.level === 'beginner' ? '초급' : diagnosis.level === 'intermediate' ? '중급' : '고급';
      sources.push({
        sourceType: 'diagnosis',
        sourceId: 'diagnosis',
        title: `수준진단 (${levelLabel})`,
        date: diagnosis.completedAt,
      });
    }
  } catch { /* no diagnosis */ }

  // Sort by date descending
  return sources.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getSessionData(topicId: string, sessionId: string): Promise<LearningSession | null> {
  const filePath = path.join(getTopicDir(topicId), 'sessions', `${sessionId}.json`);
  return readJSON<LearningSession>(filePath);
}

export async function getTestData(topicId: string, testId: string): Promise<TestResult | null> {
  const filePath = path.join(getTopicDir(topicId), 'tests', `${testId}.json`);
  return readJSON<TestResult>(filePath);
}

export async function getDiagnosisData(topicId: string): Promise<DiagnosisData | null> {
  const filePath = path.join(getTopicDir(topicId), 'diagnosis.json');
  return readJSON<DiagnosisData>(filePath);
}

export async function getDiagnosisSessionData(topicId: string): Promise<LearningSession | null> {
  const filePath = path.join(getTopicDir(topicId), 'diagnosis-session.json');
  return readJSON<LearningSession>(filePath);
}
