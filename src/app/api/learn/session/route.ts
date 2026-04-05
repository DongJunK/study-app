import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLearningSession } from '@/lib/data/sessionManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const sessionId = searchParams.get('sessionId');

    if (!topicId || !sessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'topicId와 sessionId가 필요합니다.', code: 'MISSING_PARAMS' } },
        { status: 400 }
      );
    }

    const session = await getLearningSession(topicId, sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: '세션을 찾을 수 없습니다.', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '세션을 불러오는데 실패했습니다.', code: 'SESSION_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}
