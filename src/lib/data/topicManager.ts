import path from 'path';
import fs from 'fs/promises';
import type { Topic } from '@/types/topic';
import type { Roadmap } from '@/types/topic';
import {
  readJSON,
  writeJSON,
  getTopicDir,
  listDirs,
  ensureDir,
} from './fileUtils';

const TOPICS_DIR = path.join(process.cwd(), 'data', 'topics');

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function createTopic(name: string): Promise<Topic> {
  const id = slugify(name);
  const dir = getTopicDir(id);
  await ensureDir(dir);

  const now = new Date().toISOString();

  const topic: Topic = {
    id,
    name,
    progress: 0,
    lastStudyDate: null,
    createdAt: now,
    weaknessCount: 0,
    status: 'new',
  };

  const roadmap: Roadmap = {
    topicId: id,
    items: [],
    currentItemIndex: 0,
  };

  await Promise.all([
    writeJSON(path.join(dir, 'meta.json'), topic),
    writeJSON(path.join(dir, 'roadmap.json'), roadmap),
    writeJSON(path.join(dir, 'weaknesses.json'), []),
    writeJSON(path.join(dir, 'answers.json'), []),
    writeJSON(path.join(dir, 'qna.json'), []),
  ]);

  return topic;
}

export async function getTopic(topicId: string): Promise<Topic | null> {
  const metaPath = path.join(getTopicDir(topicId), 'meta.json');
  return readJSON<Topic>(metaPath);
}

export async function getAllTopics(): Promise<Topic[]> {
  const dirs = await listDirs(TOPICS_DIR);

  const topics = await Promise.all(
    dirs.map((dir) => getTopic(dir))
  );

  return topics.filter((t): t is Topic => t !== null);
}

export async function updateTopic(
  topicId: string,
  updates: Partial<Topic>
): Promise<Topic | null> {
  const existing = await getTopic(topicId);
  if (!existing) return null;

  const updated: Topic = { ...existing, ...updates, id: existing.id };
  const metaPath = path.join(getTopicDir(topicId), 'meta.json');
  await writeJSON(metaPath, updated);

  return updated;
}

export async function deleteTopic(topicId: string): Promise<boolean> {
  try {
    const dir = getTopicDir(topicId);
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
