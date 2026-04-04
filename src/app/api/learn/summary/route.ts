import { NextResponse } from 'next/server';
import { askClaude } from '@/lib/claude/client';
import { getSessionSummaryPrompt } from '@/lib/prompts/summary';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: string };

    if (!messages || typeof messages !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'messages 문자열이 필요합니다.',
            code: 'INVALID_MESSAGES',
          },
        },
        { status: 400 }
      );
    }

    const prompt = getSessionSummaryPrompt(messages);
    const response = await askClaude(prompt);

    // Parse the JSON from the response
    let summaryData: {
      learned: string[];
      uncertain: string[];
      nextSteps: string[];
    };

    try {
      const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response.text;
      summaryData = JSON.parse(jsonStr.trim());
    } catch {
      // Fallback if parsing fails
      summaryData = {
        learned: ['학습 내용을 요약하는데 실패했습니다.'],
        uncertain: [],
        nextSteps: ['다시 학습을 시도해보세요.'],
      };
    }

    return NextResponse.json({ success: true, data: summaryData });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '세션 요약을 생성하는데 실패했습니다.',
          code: 'SUMMARY_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
