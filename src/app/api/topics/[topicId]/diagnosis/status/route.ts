import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic } from '@/lib/data/topicManager';
import { getDiagnosis } from '@/lib/data/roadmapManager';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis/status'>
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

    const diagnosis = await getDiagnosis(topicId);
    return NextResponse.json({
      success: true,
      data: {
        hasDiagnosis: diagnosis !== null,
        diagnosis,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '진단 상태를 확인하는데 실패했습니다.',
          code: 'DIAGNOSIS_STATUS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
