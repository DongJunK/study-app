import { NextResponse } from 'next/server';
import { getAllTopics } from '@/lib/data/topicManager';

export async function GET() {
  try {
    const topics = await getAllTopics();

    const totalProgress =
      topics.length > 0
        ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
        : 0;

    const totalWeaknesses = topics.reduce((sum, t) => sum + t.weaknessCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        topics,
        totalProgress,
        totalWeaknesses,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: '대시보드 데이터를 불러오는데 실패했습니다.', code: 'DASHBOARD_FETCH_ERROR' },
      },
      { status: 500 }
    );
  }
}
