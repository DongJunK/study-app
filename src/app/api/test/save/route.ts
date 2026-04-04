import { saveTestResult } from '@/lib/data/testManager';
import type { TestResult } from '@/types/test';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, result } = body as { topicId: string; result: TestResult };

    if (!topicId || !result) {
      return Response.json(
        {
          success: false,
          error: { message: 'topicId and result are required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    await saveTestResult(topicId, result);

    return Response.json({ success: true, data: { id: result.id } });
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          message: '테스트 결과 저장에 실패했습니다.',
          code: 'SAVE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
