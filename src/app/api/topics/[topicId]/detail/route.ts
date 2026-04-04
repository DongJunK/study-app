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

    // Read recent sessions
    const sessionsDir = path.join(getTopicDir(topicId), 'sessions');
    let recentSessions: Array<{ id: string; filename: string; date: string; size: number }> = [];
    try {
      const files = await fs.readdir(sessionsDir);
      const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse().slice(0, 5);
      recentSessions = await Promise.all(
        mdFiles.map(async (f) => {
          const stat = await fs.stat(path.join(sessionsDir, f));
          return {
            id: f.replace('.md', ''),
            filename: f,
            date: stat.mtime.toISOString(),
            size: stat.size,
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
