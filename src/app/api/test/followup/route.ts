import { createClaudeStream } from '@/lib/claude/stream';
import { saveFollowUpQnA } from '@/lib/data/testManager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, testId, question, context } = body as {
      topicId: string;
      testId: string;
      question: string;
      context: string;
    };

    if (!topicId || !testId || !question) {
      return Response.json(
        {
          success: false,
          error: { message: 'topicId, testId, question are required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    const systemPrompt = `당신은 학습 도우미입니다. 학생이 테스트 후 모범답안에 대해 질문하고 있습니다.

## 모범답안 컨텍스트
${context || '(컨텍스트 없음)'}

## 규칙
- 한국어로 답변하세요
- 모범답안과 관련된 질문에 상세히 답변하세요
- 추가적인 학습 포인트도 제시해주세요
- 실용적인 예시를 포함해주세요`;

    // Save the Q&A entry (answer will be empty for now, updated client-side)
    await saveFollowUpQnA(topicId, testId, { question, answer: '' });

    const stream = createClaudeStream(question, systemPrompt);

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
          message: '후속 질문 처리에 실패했습니다.',
          code: 'FOLLOWUP_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
