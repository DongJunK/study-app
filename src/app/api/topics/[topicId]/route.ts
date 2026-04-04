import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic, updateTopic, deleteTopic } from '@/lib/data/topicManager';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]'>
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

    return NextResponse.json({ success: true, data: topic });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '주제를 불러오는데 실패했습니다.', code: 'TOPIC_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]'>
) {
  try {
    const { topicId } = await ctx.params;
    const body = await request.json();

    const updated = await updateTopic(topicId, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: '주제를 찾을 수 없습니다.', code: 'TOPIC_NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '주제를 수정하는데 실패했습니다.', code: 'TOPIC_UPDATE_ERROR' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]'>
) {
  try {
    const { topicId } = await ctx.params;
    const deleted = await deleteTopic(topicId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { message: '주제를 삭제하는데 실패했습니다.', code: 'TOPIC_DELETE_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id: topicId } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '주제를 삭제하는데 실패했습니다.', code: 'TOPIC_DELETE_ERROR' } },
      { status: 500 }
    );
  }
}
