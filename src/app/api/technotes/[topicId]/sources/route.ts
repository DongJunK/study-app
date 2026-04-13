import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAvailableSources } from '@/lib/data/techNoteManager';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]/sources'>
) {
  try {
    const { topicId } = await ctx.params;
    const sources = await getAvailableSources(topicId);
    return NextResponse.json({ success: true, data: sources });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '소스 목록을 불러오는데 실패했습니다.', code: 'SOURCES_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}
