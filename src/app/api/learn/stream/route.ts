import { createClaudeStream } from '@/lib/claude/stream';
import { getSocraticPrompt } from '@/lib/prompts/socratic';
import { getBasicPrompt } from '@/lib/prompts/basic';
import { getFeynmanPrompt } from '@/lib/prompts/feynman';
import type { LearningMode, ContentFormat } from '@/types/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      topicName,
      conceptTitle,
      mode,
      formats,
      previousMessages,
      reviewQuestions,
    } = body as {
      topicName: string;
      conceptTitle: string;
      mode: LearningMode;
      formats: ContentFormat[];
      previousMessages?: string;
      reviewQuestions?: string[];
    };

    if (!topicName || !conceptTitle || !mode) {
      return Response.json(
        {
          success: false,
          error: {
            message: 'topicName, conceptTitle, mode는 필수입니다.',
            code: 'INVALID_PARAMS',
          },
        },
        { status: 400 }
      );
    }

    let systemPrompt: string;
    if (mode === 'basic') {
      systemPrompt = getBasicPrompt(topicName, conceptTitle, formats);
    } else if (mode === 'socratic') {
      systemPrompt = getSocraticPrompt(topicName, conceptTitle, formats || ['text']);
    } else {
      systemPrompt = getFeynmanPrompt(topicName, conceptTitle);
    }

    // Append review questions instruction to system prompt
    if (reviewQuestions && reviewQuestions.length > 0) {
      const questionList = reviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      systemPrompt += `\n\n## 복습 모드\n이것은 복습 학습입니다. 아래의 질문들을 반드시 주어진 순서대로 하나씩 출제하세요.\n학생이 각 질문에 답변하면 피드백을 제공한 후 다음 질문으로 넘어가세요.\n모든 질문을 완료하면 전체 복습 요약을 제공하세요.\n\n### 복습 질문 목록:\n${questionList}`;
    }

    // Build the user prompt with conversation context
    let prompt: string;
    if (previousMessages) {
      prompt = `이전 대화 내용:\n${previousMessages}\n\n위 대화를 이어서 진행하세요.`;
    } else if (reviewQuestions && reviewQuestions.length > 0) {
      prompt = '복습 학습을 시작합니다. 첫 번째 복습 질문을 해주세요.';
    } else {
      prompt = '학습을 시작합니다. 첫 번째 질문을 해주세요.';
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
          message: '학습 스트리밍을 시작하는데 실패했습니다.',
          code: 'LEARN_STREAM_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
