import { NextRequest, NextResponse } from 'next/server';
import { getGrowthData, getAllGrowthData } from '@/lib/data/growthManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (topicId) {
      const data = await getGrowthData(topicId);
      if (!data) {
        return NextResponse.json(
          { success: false, error: { message: '주제를 찾을 수 없습니다.', code: 'TOPIC_NOT_FOUND' } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    const allData = await getAllGrowthData();
    return NextResponse.json({ success: true, data: allData });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '성장 데이터를 불러올 수 없습니다.', code: 'GROWTH_FETCH_FAILED' } },
      { status: 500 }
    );
  }
}
