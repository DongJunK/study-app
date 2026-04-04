import { readJSON, writeJSON, getTopicDir } from './fileUtils';
import type { Message } from '@/types/session';

export interface DiagnosisSession {
  topicId: string;
  messages: Message[];
  isComplete: boolean;
  result: string | null;
  updatedAt: string;
}

export async function saveDiagnosisSession(
  topicId: string,
  session: DiagnosisSession
): Promise<void> {
  const filePath = `${getTopicDir(topicId)}/diagnosis-session.json`;
  await writeJSON(filePath, session);
}

export async function getDiagnosisSession(
  topicId: string
): Promise<DiagnosisSession | null> {
  const filePath = `${getTopicDir(topicId)}/diagnosis-session.json`;
  return readJSON<DiagnosisSession>(filePath);
}

export async function deleteDiagnosisSession(topicId: string): Promise<void> {
  const fs = await import('fs/promises');
  const filePath = `${getTopicDir(topicId)}/diagnosis-session.json`;
  try {
    await fs.unlink(filePath);
  } catch {
    /* ignore */
  }
}
