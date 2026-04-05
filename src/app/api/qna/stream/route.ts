import { NextResponse } from 'next/server';
import { createClaudeStream } from '@/lib/claude/stream';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, learningContext, previousMessages } = body as {
      prompt: string;
      learningContext: string;
      previousMessages?: string;
    };

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: { message: 'prompt가 필요합니다.', code: 'MISSING_PROMPT' } },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a personal learning assistant. You have access to the user's complete learning history and data.

Based on this data, you can:
- Analyze the user's current skill level per topic
- Identify patterns in their weaknesses
- Recommend what to study next
- Answer questions about their learning progress
- Provide encouragement and specific advice

IMPORTANT:
- Always respond in Korean
- Be specific - reference actual data (scores, weakness names, progress percentages)
- Be encouraging but honest about areas that need improvement
- If asked about something not in the data, say so clearly

=== 사용자 학습 데이터 ===
${learningContext}
========================

${previousMessages ? `=== 이전 대화 ===\n${previousMessages}\n=================` : ''}`;

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
      { success: false, error: { message: 'QNA 응답에 실패했습니다.', code: 'QNA_ERROR' } },
      { status: 500 }
    );
  }
}
