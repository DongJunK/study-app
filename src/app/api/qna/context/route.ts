import { NextResponse } from 'next/server';
import { getAllTopics } from '@/lib/data/topicManager';
import { getWeaknesses } from '@/lib/data/weaknessManager';
import { getTestResults } from '@/lib/data/testManager';
import { getDiagnosis } from '@/lib/data/roadmapManager';

export async function GET() {
  try {
    const topics = await getAllTopics();

    const context: string[] = [];

    for (const topic of topics) {
      const [diagnosis, weaknesses, testResults] = await Promise.all([
        getDiagnosis(topic.id),
        getWeaknesses(topic.id),
        getTestResults(topic.id),
      ]);

      context.push(`## ${topic.name}`);
      context.push(`- 진행률: ${topic.progress}%`);
      context.push(`- 상태: ${topic.status}`);

      if (diagnosis) {
        context.push(`- 수준: ${diagnosis.level}`);
        context.push(`- 강점: ${diagnosis.strengths.join(', ')}`);
        context.push(`- 약점 영역: ${diagnosis.weaknesses.join(', ')}`);
        if (diagnosis.summary) context.push(`- 진단 요약: ${diagnosis.summary}`);
      }

      const activeWeaknesses = weaknesses.filter(w => w.status !== 'understood');
      const resolvedWeaknesses = weaknesses.filter(w => w.status === 'understood');
      if (activeWeaknesses.length > 0) {
        context.push(`- 현재 약점 (${activeWeaknesses.length}개): ${activeWeaknesses.map(w => `${w.concept}(${w.status}, ${w.detectedCount || 1}번째)`).join(', ')}`);
      }
      if (resolvedWeaknesses.length > 0) {
        context.push(`- 해결한 약점 (${resolvedWeaknesses.length}개): ${resolvedWeaknesses.map(w => w.concept).join(', ')}`);
      }

      if (testResults.length > 0) {
        const recent = testResults.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
        context.push(`- 최근 테스트 (${testResults.length}회 중 최근 3개):`);
        for (const t of recent) {
          const pct = Math.round((t.totalScore / t.maxTotalScore) * 100);
          context.push(`  - ${t.type} ${pct}점 (${t.passed ? '합격' : '불합격'}) - ${t.createdAt.slice(0, 10)}`);
        }
      }

      context.push('');
    }

    return NextResponse.json({
      success: true,
      data: {
        topicCount: topics.length,
        context: context.join('\n'),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '학습 데이터를 불러오는데 실패했습니다.', code: 'CONTEXT_ERROR' } },
      { status: 500 }
    );
  }
}
