import { askClaude } from '@/lib/claude/client';
import { getWeaknessClassifyPrompt } from '@/lib/prompts/weakness-classify';
import type { TestAnswer } from '@/types/test';
import type { WeaknessStatus } from '@/types/weakness';

export async function autoClassifyFromTest(
  topicId: string,
  topicName: string,
  testAnswers: TestAnswer[]
): Promise<void> {
  // Format test answers for the prompt
  const answersText = testAnswers
    .map(
      (a, i) =>
        `문제 ${i + 1}:
- 질문: ${a.question}
- 학생 답변: ${a.userAnswer}
- 모범 답안: ${a.modelAnswer}
- 점수: ${a.score}/${a.maxScore}
- 합격: ${a.passed ? '예' : '아니오'}
- 피드백: ${a.feedback}`
    )
    .join('\n\n');

  const prompt = getWeaknessClassifyPrompt(topicName, answersText);

  try {
    const response = await askClaude(prompt);

    // Extract JSON from response
    const jsonMatch = response.text.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[1]) as {
      weaknesses: Array<{ concept: string; status: WeaknessStatus }>;
    };

    if (!parsed.weaknesses || !Array.isArray(parsed.weaknesses)) return;

    // POST to weakness API to save
    await fetch(`${getBaseUrl()}/api/topics/${topicId}/weakness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weaknesses: parsed.weaknesses }),
    });
  } catch {
    // Silently fail - weakness classification is non-critical
    console.error('Failed to auto-classify weaknesses');
  }
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
