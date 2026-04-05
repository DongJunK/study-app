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
  const dir = getTopicDir(topicId);
  const metaPath = path.join(dir, 'meta.json');
  const topic = await readJSON<Topic>(metaPath);
  if (!topic) return null;

  // Enrich with live-calculated data
  try {
    // Progress from roadmap
    const roadmap = await readJSON<Roadmap>(path.join(dir, 'roadmap.json'));
    if (roadmap && roadmap.items.length > 0) {
      const completed = roadmap.items.filter(i => i.status === 'completed').length;
      topic.progress = Math.round((completed / roadmap.items.length) * 100);
    }

    // Weakness count
    const weaknesses = await readJSON<Array<{ status: string }>>(path.join(dir, 'weaknesses.json'));
    if (weaknesses) {
      topic.weaknessCount = weaknesses.filter(w => w.status !== 'understood').length;
    }

    // Last study date from sessions
    const sessionsDir = path.join(dir, 'sessions');
    try {
      const files = await fs.readdir(sessionsDir);
      if (files.length > 0) {
        const stats = await Promise.all(
          files.filter(f => f.endsWith('.json')).map(async f => {
            const stat = await fs.stat(path.join(sessionsDir, f));
            return stat.mtime;
          })
        );
        if (stats.length > 0) {
          const latest = new Date(Math.max(...stats.map(s => s.getTime())));
          topic.lastStudyDate = latest.toISOString();
        }
      }
    } catch {
      // No sessions dir
    }
  } catch {
    // Return topic as-is if enrichment fails
  }

  return topic;
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
