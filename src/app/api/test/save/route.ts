import { saveTestResult } from '@/lib/data/testManager';
import { recordTestScore } from '@/lib/data/growthManager';
import { updateLevelFromTestResults } from '@/lib/data/roadmapManager';
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

    // Record growth data
    try {
      await recordTestScore(topicId, result.totalScore, result.maxTotalScore);
    } catch {
      // Growth recording failure should not block test save
    }

    // Update level based on test results
    let levelChange: { changed: boolean; oldLevel?: string; newLevel?: string } = { changed: false };
    try {
      levelChange = await updateLevelFromTestResults(topicId, result.totalScore, result.maxTotalScore);
    } catch {
      // Level update failure should not block test save
    }

    return Response.json({ success: true, data: { id: result.id, levelChange } });
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
