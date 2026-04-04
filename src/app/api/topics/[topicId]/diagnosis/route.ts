import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic } from '@/lib/data/topicManager';
import { createClaudeStream } from '@/lib/claude/stream';
import { getDiagnosisPrompt } from '@/lib/prompts/diagnosis';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '주제를 찾을 수 없습니다.',
            code: 'TOPIC_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const userMessage = body.message as string | undefined;

    const systemPrompt = getDiagnosisPrompt(topic.name);
    const prompt = userMessage || `"${topic.name}" 주제에 대한 수준 진단을 시작해주세요.`;

    const stream = createClaudeStream(prompt, systemPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '수준 진단을 시작하는데 실패했습니다.',
          code: 'DIAGNOSIS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
