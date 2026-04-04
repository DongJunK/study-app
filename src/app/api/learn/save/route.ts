import { NextResponse } from 'next/server';
import { saveLearningSession } from '@/lib/data/sessionManager';
import type { LearningSession } from '@/types/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session } = body as { session: LearningSession };

    if (!session || !session.id || !session.topicId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'session 데이터가 필요합니다.',
            code: 'INVALID_SESSION',
          },
        },
        { status: 400 }
      );
    }

    await saveLearningSession(session);

    return NextResponse.json({ success: true, data: { id: session.id } });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '세션을 저장하는데 실패했습니다.',
          code: 'SESSION_SAVE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
