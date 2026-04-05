import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic, updateTopic } from '@/lib/data/topicManager';
import { saveDiagnosis } from '@/lib/data/roadmapManager';
import { classifyWeaknesses } from '@/lib/data/weaknessManager';
import type { DiagnosisData } from '@/lib/data/roadmapManager';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis/save'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '주제를 찾을 수 없습니다.',
            code: 'TOPIC_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Handle reset request (for rediagnose)
    if (body.reset === true) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { getTopicDir } = await import('@/lib/data/fileUtils');
      const diagPath = path.default.join(getTopicDir(topicId), 'diagnosis.json');
      try { await fs.default.unlink(diagPath); } catch { /* ignore */ }
      return NextResponse.json({ success: true, data: { reset: true } });
    }

    const { level, strengths, weaknesses, summary } = body;

    if (!level || !strengths || !weaknesses) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '진단 데이터가 올바르지 않습니다.',
            code: 'INVALID_DIAGNOSIS_DATA',
          },
        },
        { status: 400 }
      );
    }

    const diagnosisData: DiagnosisData = {
      level,
      strengths,
      weaknesses,
      summary: summary || '',
      completedAt: new Date().toISOString(),
    };

    await saveDiagnosis(topicId, diagnosisData);

    // Save weaknesses from diagnosis to weaknesses.json
    if (Array.isArray(weaknesses) && weaknesses.length > 0) {
      const weaknessItems = weaknesses.map((concept: string) => ({
        concept,
        status: 'unknown' as const,
      }));
      await classifyWeaknesses(topicId, weaknessItems);
    }

    // Update topic status to in-progress
    await updateTopic(topicId, { status: 'in-progress' });

    return NextResponse.json(
      { success: true, data: diagnosisData },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '진단 결과를 저장하는데 실패했습니다.',
          code: 'DIAGNOSIS_SAVE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
