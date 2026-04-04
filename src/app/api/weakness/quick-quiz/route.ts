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

    const systemPrompt = `당신은 "${topicName}" 분야의 퀴즈 출제 전문가입니다.

"${concept}" 개념에 대한 빠른 확인 퀴즈를 진행합니다.

## 퀴즈 규칙
- 총 3문제를 출제합니다
- 각 문제는 난이도가 점진적으로 올라갑니다 (기초 → 응용 → 심화)
- 각 문제당 제한시간은 없지만, 전체 5분 내 완료 목표입니다
- 학생이 답변하면 즉시 채점하고 피드백을 제공합니다

## 채점 기준
각 답변 후 반드시 다음 JSON을 포함하세요 (반드시 \`\`\`json 코드 블록으로 감싸세요):

\`\`\`json
{"questionNumber": N, "score": N, "maxScore": 10, "passed": true/false, "feedback": "피드백"}
\`\`\`

- passed 기준: score >= 7

## 최종 결과
3문제 모두 끝나면 최종 결과를 다음 JSON으로 제공하세요:

\`\`\`json
{"type": "quiz-result", "totalScore": N, "maxTotalScore": 30, "passed": true/false, "message": "종합 평가 메시지"}
\`\`\`

- 전체 passed 기준: totalScore >= 21 (평균 7점 이상)

## 진행
- 모든 대화는 한국어
- 한 번에 한 문제만 출제
- 첫 번째 문제를 바로 시작하세요
- 격려하되 정확한 채점`;

    let prompt: string;
    if (previousMessages) {
      prompt = `이전 대화 내용:\n${previousMessages}\n\n위 대화를 이어서 진행하세요.`;
    } else {
      prompt = `"${concept}" 개념에 대한 빠른 퀴즈를 시작합니다. 첫 번째 문제를 내주세요.`;
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
          message: '퀴즈를 시작하는데 실패했습니다.',
          code: 'QUICK_QUIZ_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
