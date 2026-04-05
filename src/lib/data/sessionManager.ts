import path from 'path';
import { v4 } from './idUtils';
import type { LastSession, LearningSession } from '@/types/session';
import { readJSON, writeJSON, getSessionsDir, getTopicDir, ensureDir } from './fileUtils';

const LAST_SESSION_FILE = 'last-session.json';

export async function saveLastSession(session: LastSession): Promise<void> {
  const sessionsDir = getSessionsDir();
  await ensureDir(sessionsDir);
  await writeJSON(path.join(sessionsDir, LAST_SESSION_FILE), session);
}

export async function getLastSession(): Promise<LastSession | null> {
  const sessionsDir = getSessionsDir();
  return readJSON<LastSession>(path.join(sessionsDir, LAST_SESSION_FILE));
}

export async function saveLearningSession(
  session: LearningSession
): Promise<void> {
  // Save under data/topics/{topicId}/sessions/
  const topicSessionsDir = path.join(getTopicDir(session.topicId), 'sessions');
  await ensureDir(topicSessionsDir);
  await writeJSON(path.join(topicSessionsDir, `${session.id}.json`), session);
}

export async function getLearningSession(
  topicId: string,
  sessionId: string
): Promise<LearningSession | null> {
  const topicSessionsDir = path.join(getTopicDir(topicId), 'sessions');
  return readJSON<LearningSession>(
    path.join(topicSessionsDir, `${sessionId}.json`)
  );
}

export function generateSessionId(): string {
  return v4();
}
