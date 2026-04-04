import { createClaudeStream } from '@/lib/claude/stream';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, concept, topicName, previousMessages } = body as {
      topicId: string;
      concept: string;
      topicName: string;
      previousMessages?: string;
    };

    if (!topicId || !concept || !topicName) {
      return Response.json(
        {
          success: false,
          error: {
            message: 'topicId, concept, topicName은 필수입니다.',
            code: 'INVALID_PARAMS',
          },
        },
        { status: 400 }
      );
    }

    const systemPrompt = `당신은 "${topicName}" 분야의 학습 튜터입니다.

학생이 "${concept}" 개념을 약점으로 가지고 있습니다. 이 개념을 집중적으로 보강해주세요.

## 진행 방식
1. 먼저 "${concept}"의 핵심을 간단명료하게 설명해주세요.
2. 실생활 비유나 예시를 들어 이해를 도와주세요.
3. 흔히 혼동하는 부분을 짚어주세요.
4. 핵심 포인트를 정리해주세요.
5. 학생에게 이해가 되었는지 물어보고, 추가 질문에 답해주세요.

## 규칙
- 모든 대화는 한국어로 진행
- 친근하고 격려하는 톤
- 어려운 용어는 쉬운 말로 풀어서 설명
- 한 번에 너무 많은 내용을 전달하지 말고 단계별로 진행
- 학생이 이해했다고 하면 "좋습니다! 이제 퀴즈로 확인해볼까요?" 라고 제안`;

    let prompt: string;
    if (previousMessages) {
      prompt = `이전 대화 내용:\n${previousMessages}\n\n위 대화를 이어서 진행하세요.`;
    } else {
      prompt = `"${concept}" 개념에 대해 집중 학습을 시작합니다. 먼저 핵심 개념을 설명해주세요.`;
    }

    const stream = createClaudeStream(prompt, systemPrompt);

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
          message: '집중 학습을 시작하는데 실패했습니다.',
          code: 'FOCUS_LEARN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
