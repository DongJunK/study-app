import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTechNotes } from '@/lib/data/techNoteManager';
import { getTopic } from '@/lib/data/topicManager';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: '주제를 찾을 수 없습니다.', code: 'TOPIC_NOT_FOUND' } },
        { status: 404 }
      );
    }

    const notes = await getTechNotes(topicId);
    return NextResponse.json({ success: true, data: { notes, topic } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '기술 정리를 불러오는데 실패했습니다.', code: 'TECHNOTE_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}
