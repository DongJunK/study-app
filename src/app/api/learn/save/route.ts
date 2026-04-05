import { NextResponse } from 'next/server';
import { saveLearningSession } from '@/lib/data/sessionManager';
import { recordSessionMinutes, recordProgressChange } from '@/lib/data/growthManager';
import { getTopic } from '@/lib/data/topicManager';
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

    // Record growth data
    try {
      const messageCount = session.messages?.length ?? 0;
      const estimatedMinutes = Math.max(1, Math.round(messageCount * 2));
      await recordSessionMinutes(session.topicId, estimatedMinutes);

      const topic = await getTopic(session.topicId);
      if (topic) {
        await recordProgressChange(session.topicId, topic.progress);
      }
    } catch {
      // Growth recording failure should not block session save
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
