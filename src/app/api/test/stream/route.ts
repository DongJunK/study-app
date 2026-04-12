import { createClaudeStream } from '@/lib/claude/stream';
import { getDeepTestPrompt, getStrategicTestPrompt } from '@/lib/prompts/deep-test';
import { getMultipleChoicePrompt, getShortAnswerPrompt } from '@/lib/prompts/quiz';
import { getWeaknesses } from '@/lib/data/weaknessManager';
import { getRoadmap, getDiagnosis } from '@/lib/data/roadmapManager';
import { getTestResults } from '@/lib/data/testManager';
import type { TestType } from '@/types/test';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, topicName, type, concepts, strategic } = body as {
      topicId: string;
      topicName: string;
      type: TestType;
      concepts: string[];
      strategic?: boolean;
    };

    if (!topicId || !type || !topicName) {
      return Response.json(
        {
          success: false,
          error: { message: 'topicId, topicName, type are required', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    let systemPrompt: string;

    if (strategic && type === 'deep-learning') {
      // Fetch weaknesses and learned concepts for strategic test
      const weaknesses = await getWeaknesses(topicId);
      const roadmap = await getRoadmap(topicId);

      const weaknessNames = weaknesses
        .filter(w => w.status !== 'understood')
        .map(w => w.concept);

      const learnedConcepts = roadmap
        ? roadmap.items.filter(i => i.status === 'completed').map(i => i.title)
        : [];

      systemPrompt = getStrategicTestPrompt(topicName, concepts || [], weaknessNames, learnedConcepts);
    } else {
      // Fetch user level for difficulty adjustment
      const diagnosis = await getDiagnosis(topicId);
      const userLevel = diagnosis?.level || 'beginner';

      // Fetch previous test results for score-based question strategy
      const allTestResults = await getTestResults(topicId);
      const levelOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
      const currentLevelOrder = levelOrder[userLevel] ?? 0;

      const previousResults = allTestResults
        .filter(r => r.type === type)
        .flatMap(r => r.answers.map(a => ({
          question: a.question,
          score: a.score,
          maxScore: a.maxScore,
          fromLowerLevel: (levelOrder[r.level || 'beginner'] ?? 0) < currentLevelOrder,
        })));

      switch (type) {
        case 'deep-learning':
          systemPrompt = getDeepTestPrompt(topicName, concepts || []);
          break;
        case 'multiple-choice':
          systemPrompt = getMultipleChoicePrompt(topicName, concepts || [], previousResults, userLevel);
          break;
        case 'short-answer':
          systemPrompt = getShortAnswerPrompt(topicName, concepts || [], previousResults, userLevel);
          break;
        default:
          return Response.json(
            {
              success: false,
              error: { message: 'Invalid test type', code: 'INVALID_TYPE' },
            },
            { status: 400 }
          );
      }
    }

    const stream = createClaudeStream(
      '테스트를 시작합니다. 첫 번째 질문을 제시해주세요.',
      systemPrompt
    );

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
          message: '테스트 스트리밍을 시작하는데 실패했습니다.',
          code: 'STREAM_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
