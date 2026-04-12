import { askClaude } from '@/lib/claude/client';
import { getAnswerComparePrompt } from '@/lib/prompts/answer-compare';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers } = body as { answers: { question: string; userAnswer: string }[] };

    if (!answers || answers.length === 0) {
      return Response.json(
        {
          success: false,
          error: { message: 'answers array is required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    const prompt = getAnswerComparePrompt(answers);
    const response = await askClaude(prompt);

    // Parse the JSON from Claude's response
    const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (Array.isArray(parsed.results)) {
          return Response.json({
            success: true,
            data: { results: parsed.results },
          });
        }
      } catch {
        // Fall through to raw response
      }
    }

    return Response.json({
      success: true,
      data: {
        results: answers.map((a, i) => ({
          questionIndex: i + 1,
          question: a.question,
          modelAnswer: response.text,
          gaps: [],
          feedback: '',
        })),
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
