import { NextResponse } from 'next/server';
import { saveLearningSession } from '@/lib/data/sessionManager';
import { recordSessionMinutes, recordProgressChange } from '@/lib/data/growthManager';
import { getTopic } from '@/lib/data/topicManager';
import type { LearningSession } from '@/types/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session, isFinalSave } = body as { session: LearningSession; isFinalSave?: boolean };

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

    // Record growth data only on final save (not auto-save)
    if (isFinalSave) {
      try {
        const minutes = session.elapsedSeconds
          ? Math.max(1, Math.round(session.elapsedSeconds / 60))
          : Math.max(1, Math.round((session.messages?.length ?? 0) * 2));
        await recordSessionMinutes(session.topicId, minutes);
      } catch {
        // Growth recording failure should not block session save
      }
    }

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
