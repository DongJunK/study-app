import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic } from '@/lib/data/topicManager';
import { getTestResults } from '@/lib/data/testManager';
import { getDiagnosis, getRoadmap } from '@/lib/data/roadmapManager';
import { getWeaknesses } from '@/lib/data/weaknessManager';
import { getGrowthData } from '@/lib/data/growthManager';
import { listDirs, getTopicDir } from '@/lib/data/fileUtils';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/detail'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: '주제를 찾을 수 없습니다.', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const [diagnosis, roadmap, testResults, weaknesses, growth] = await Promise.all([
      getDiagnosis(topicId),
      getRoadmap(topicId),
      getTestResults(topicId),
      getWeaknesses(topicId),
      getGrowthData(topicId).catch(() => null),
    ]);

    // Read recent sessions with details
    const sessionsDir = path.join(getTopicDir(topicId), 'sessions');
    let recentSessions: Array<{
      id: string;
      filename: string;
      date: string;
      size: number;
      mode?: string;
      roadmapItemId?: string | null;
      messageCount?: number;
      startedAt?: string;
      elapsedSeconds?: number;
      conceptTitle?: string;
    }> = [];
    try {
      const files = await fs.readdir(sessionsDir);
      const sessionFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 20);
      recentSessions = await Promise.all(
        sessionFiles.map(async (f) => {
          const stat = await fs.stat(path.join(sessionsDir, f));
          let mode: string | undefined;
          let roadmapItemId: string | null | undefined;
          let messageCount: number | undefined;
          let startedAt: string | undefined;
          let elapsedSeconds: number | undefined;
          try {
            const content = await fs.readFile(path.join(sessionsDir, f), 'utf-8');
            const session = JSON.parse(content);
            mode = session.mode;
            roadmapItemId = session.roadmapItemId;
            messageCount = session.messages?.length ?? 0;
            startedAt = session.startedAt;
            elapsedSeconds = session.elapsedSeconds;
          } catch { /* ignore parse errors */ }

          // Resolve roadmap item title
          let conceptTitle: string | undefined;
          if (roadmapItemId && roadmap) {
            const item = roadmap.items.find(i => i.id === roadmapItemId);
            if (item) conceptTitle = item.title;
          }

          return {
            id: f.replace('.json', ''),
            filename: f,
            date: startedAt || stat.mtime.toISOString(),
            size: stat.size,
            mode,
            roadmapItemId,
            messageCount,
            startedAt,
            elapsedSeconds,
            conceptTitle,
          };
        })
      );
    } catch {
      // No sessions directory
    }

    return NextResponse.json({
      success: true,
      data: {
        topic,
        diagnosis,
        roadmap,
        testResults: testResults.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        recentSessions,
        weaknesses,
        growth,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: '상세 정보를 불러오는데 실패했습니다.', code: 'DETAIL_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}
