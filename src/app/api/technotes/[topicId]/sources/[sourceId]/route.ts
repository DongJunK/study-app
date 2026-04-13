import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionData, getTestData, getDiagnosisData, getDiagnosisSessionData } from '@/lib/data/techNoteManager';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]/sources/[sourceId]'>
) {
  try {
    const { topicId, sourceId } = await ctx.params;
    const sourceType = req.nextUrl.searchParams.get('type');

    if (!sourceType) {
      return NextResponse.json(
        { success: false, error: { message: 'type 파라미터가 필요합니다.' } },
        { status: 400 }
      );
    }

    if (sourceType === 'diagnosis') {
      const diagnosis = await getDiagnosisData(topicId);
      if (!diagnosis) {
        return NextResponse.json(
          { success: false, error: { message: '수준진단 결과를 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }

      const levelLabel = diagnosis.level === 'beginner' ? '초급' : diagnosis.level === 'intermediate' ? '중급' : '고급';

      // Try to get diagnosis session for conversation highlights
      const diagSession = await getDiagnosisSessionData(topicId);
      const highlights = diagSession?.messages
        ?.filter((m) => m.role === 'assistant')
        .map((m) => {
          const text = m.content.replace(/```[\s\S]*?```/g, '[코드]').replace(/\n+/g, ' ').trim();
          return text.length > 200 ? text.slice(0, 200) + '...' : text;
        })
        .filter((t) => t.length > 10)
        .slice(0, 5) || [];

      const preview = {
        level: levelLabel,
        summary: diagnosis.summary,
        strengths: diagnosis.strengths,
        weaknesses: diagnosis.weaknesses,
        highlights,
      };

      return NextResponse.json({ success: true, data: preview });
    } else if (sourceType === 'session') {
      const session = await getSessionData(topicId, sourceId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: { message: '세션을 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }

      // Extract key learning points from assistant messages
      const assistantMessages = session.messages
        .filter((m) => m.role === 'assistant');

      const highlights = assistantMessages
        .map((m) => {
          const text = m.content.replace(/```[\s\S]*?```/g, '[코드]').replace(/\n+/g, ' ').trim();
          return text.length > 200 ? text.slice(0, 200) + '...' : text;
        })
        .filter((t) => t.length > 10)
        .slice(0, 8);

      // Extract user questions too
      const userQuestions = session.messages
        .filter((m) => m.role === 'user')
        .map((m) => {
          const text = m.content.replace(/\n+/g, ' ').trim();
          return text.length > 100 ? text.slice(0, 100) + '...' : text;
        })
        .filter((t) => t.length > 5)
        .slice(0, 5);

      const preview = {
        summary: session.summary || null,
        messageCount: session.messages.length,
        mode: session.mode,
        highlights,
        userQuestions,
      };

      return NextResponse.json({ success: true, data: preview });
    } else {
      const test = await getTestData(topicId, sourceId);
      if (!test) {
        return NextResponse.json(
          { success: false, error: { message: '테스트를 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }

      const typeLabel = test.type === 'multiple-choice' ? '객관식' : test.type === 'short-answer' ? '주관식' : '심화학습';
      const preview = {
        testType: typeLabel,
        totalScore: test.totalScore,
        maxTotalScore: test.maxTotalScore,
        passed: test.passed,
        questions: test.answers.map((a) => ({
          question: a.question.length > 120 ? a.question.slice(0, 120) + '...' : a.question,
          passed: a.passed,
          score: a.score,
          maxScore: a.maxScore,
        })),
      };

      return NextResponse.json({ success: true, data: preview });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '소스 미리보기를 불러오는데 실패했습니다.' } },
      { status: 500 }
    );
  }
}
