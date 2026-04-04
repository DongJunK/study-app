import { createClaudeStream } from '@/lib/claude/stream';
import { getDeepTestPrompt } from '@/lib/prompts/deep-test';
import { getMultipleChoicePrompt, getShortAnswerPrompt } from '@/lib/prompts/quiz';
import type { TestType } from '@/types/test';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, topicName, type, concepts } = body as {
      topicId: string;
      topicName: string;
      type: TestType;
      concepts: string[];
    };

    if (!topicId || !type || !topicName) {
      return Response.json(
        {
          success: false,
          error: { message: 'topicId, topicName, type are required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    let systemPrompt: string;
    switch (type) {
      case 'deep-learning':
        systemPrompt = getDeepTestPrompt(topicName, concepts || []);
        break;
      case 'multiple-choice':
        systemPrompt = getMultipleChoicePrompt(topicName, concepts || []);
        break;
      case 'short-answer':
        systemPrompt = getShortAnswerPrompt(topicName, concepts || []);
        break;
      default:
        return Response.json(
          {
            success: false,
            error: { message: 'Invalid test type', code: 'INVALID_TYPE' },
          },
          { status: 400 }
        );
    }

    const stream = createClaudeStream(
      '테스트를 시작합니다. 첫 번째 질문을 제시해주세요.',
      systemPrompt
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          message: '테스트 스트리밍을 시작하는데 실패했습니다.',
          code: 'STREAM_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
