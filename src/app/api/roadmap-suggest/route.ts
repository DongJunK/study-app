import { NextResponse } from 'next/server';
import { createClaudeStream } from '@/lib/claude/stream';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicName, currentRoadmap, userMessage, previousMessages } = body;

    if (!topicName || !userMessage) {
      return NextResponse.json(
        { success: false, error: { message: 'topicName과 userMessage가 필요합니다.', code: 'MISSING_PARAMS' } },
        { status: 400 }
      );
    }

    const roadmapContext = currentRoadmap
      ? `\n\n현재 로드맵:\n${currentRoadmap.map((item: { order: number; title: string; status: string }) => `${item.order}. ${item.title} (${item.status})`).join('\n')}`
      : '';

    const systemPrompt = `You are a learning roadmap advisor for "${topicName}".${roadmapContext}

Your role:
- Understand what the user wants to learn through conversation
- Ask clarifying questions if needed (e.g., their goal, experience level with the sub-topic)
- When you have enough information, suggest specific roadmap items to add

CRITICAL RULES:
1. All responses in Korean
2. Be conversational and helpful
3. When suggesting items, output them in this JSON format at the END of your message:

\`\`\`json
{"suggestedItems": [{"title": "항목 제목", "description": "간단한 설명"}]}
\`\`\`

4. Only include the JSON when you have concrete suggestions ready
5. You can have multiple conversation turns before suggesting
6. NEVER simulate user responses

${previousMessages ? `\n이전 대화:\n${previousMessages}` : ''}`;

    const stream = createClaudeStream(userMessage, systemPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '로드맵 추천에 실패했습니다.', code: 'SUGGEST_ERROR' } },
      { status: 500 }
    );
  }
}
