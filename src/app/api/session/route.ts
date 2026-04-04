import { NextRequest, NextResponse } from 'next/server';
import { getLastSession, saveLastSession } from '@/lib/data/sessionManager';
import type { LastSession } from '@/types/session';

export async function GET() {
  try {
    const session = await getLastSession();
    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '세션 정보를 불러올 수 없습니다.', code: 'SESSION_FETCH_FAILED' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LastSession = await request.json();

    if (!body.topicId || !body.sessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'topicId와 sessionId가 필요합니다.', code: 'MISSING_FIELDS' } },
        { status: 400 }
      );
    }

    await saveLastSession(body);
    return NextResponse.json({ success: true, data: body });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '세션을 저장할 수 없습니다.', code: 'SESSION_SAVE_FAILED' } },
      { status: 500 }
    );
  }
}
