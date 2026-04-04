import { askClaude } from '@/lib/claude/client';
import { getAnswerComparePrompt } from '@/lib/prompts/answer-compare';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, userAnswer } = body as { question: string; userAnswer: string };

    if (!question || !userAnswer) {
      return Response.json(
        {
          success: false,
          error: { message: 'question and userAnswer are required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    const prompt = getAnswerComparePrompt(userAnswer, question);
    const response = await askClaude(prompt);

    // Parse the JSON from Claude's response
    const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return Response.json({
          success: true,
          data: {
            modelAnswer: parsed.modelAnswer || '',
            gaps: parsed.gaps || [],
            feedback: parsed.feedback || '',
          },
        });
      } catch {
        // Fall through to raw response
      }
    }

    return Response.json({
      success: true,
      data: {
        modelAnswer: response.text,
        gaps: [],
        feedback: '',
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          message: '모범답안 비교에 실패했습니다.',
          code: 'COMPARE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
