import { askClaude } from '@/lib/claude/client';
import { getMCBulkGeneratePrompt } from '@/lib/prompts/quiz';
import { getWeaknesses } from '@/lib/data/weaknessManager';
import { getRoadmap } from '@/lib/data/roadmapManager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, topicName, concepts, strategic } = body as {
      topicId: string;
      topicName: string;
      concepts?: string[];
      strategic?: boolean;
    };

    if (!topicId || !topicName) {
      return Response.json(
        { success: false, error: { message: 'topicId and topicName are required', code: 'INVALID_PARAMS' } },
        { status: 400 }
      );
    }

    let weaknessNames: string[] = [];
    let learnedConcepts: string[] = [];

    if (strategic) {
      const weaknesses = await getWeaknesses(topicId);
      const roadmap = await getRoadmap(topicId);
      weaknessNames = weaknesses.filter(w => w.status !== 'understood').map(w => w.concept);
      learnedConcepts = roadmap
        ? roadmap.items.filter(i => i.status === 'completed').map(i => i.title)
        : [];
    }

    const prompt = getMCBulkGeneratePrompt(
      topicName,
      concepts || [],
      strategic,
      weaknessNames,
      learnedConcepts
    );

    const response = await askClaude(prompt);

    // Parse JSON from response
    const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/) || response.text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { success: false, error: { message: 'Failed to parse questions from AI response', code: 'PARSE_ERROR' } },
        { status: 500 }
      );
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const data = JSON.parse(jsonStr);

    return Response.json({ success: true, data: data.questions });
  } catch (e) {
    return Response.json(
      { success: false, error: { message: e instanceof Error ? e.message : '문제 생성에 실패했습니다.', code: 'GENERATE_ERROR' } },
      { status: 500 }
    );
  }
}
