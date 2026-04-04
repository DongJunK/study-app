import { createClaudeStream } from '@/lib/claude/stream';
import { getSocraticPrompt } from '@/lib/prompts/socratic';
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
    } = body as {
      topicName: string;
      conceptTitle: string;
      mode: LearningMode;
      formats: ContentFormat[];
      previousMessages?: string;
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
    if (mode === 'socratic') {
      systemPrompt = getSocraticPrompt(topicName, conceptTitle, formats || ['text']);
    } else {
      systemPrompt = getFeynmanPrompt(topicName, conceptTitle);
    }

    // Build the user prompt with conversation context
    let prompt: string;
    if (previousMessages) {
      prompt = `이전 대화 내용:\n${previousMessages}\n\n위 대화를 이어서 진행하세요.`;
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
