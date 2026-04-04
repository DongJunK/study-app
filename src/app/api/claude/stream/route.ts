import { createClaudeStream } from '@/lib/claude/stream';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        {
          success: false,
          error: { message: 'prompt is required', code: 'INVALID_PROMPT' },
        },
        { status: 400 }
      );
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
          message: 'Claude 스트리밍을 시작하는데 실패했습니다.',
          code: 'STREAM_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
