import { createClaudeStream } from '@/lib/claude/stream';
import { getSessionData, getTestData, getDiagnosisData, getDiagnosisSessionData } from '@/lib/data/techNoteManager';
import { getTopic } from '@/lib/data/topicManager';
import { getTechNoteFromSessionPrompt, getTechNoteFromTestPrompt, getTechNoteFromDiagnosisPrompt } from '@/lib/prompts/technote';

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/technotes/[topicId]/generate'>
) {
  try {
    const { topicId } = await ctx.params;
    const { sourceType, sourceId } = await request.json() as {
      sourceType: 'session' | 'test' | 'diagnosis';
      sourceId: string;
    };

    if (!sourceType || !sourceId) {
      return new Response(JSON.stringify({ success: false, error: { message: 'sourceType과 sourceId가 필요합니다.' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const topic = await getTopic(topicId);
    if (!topic) {
      return new Response(JSON.stringify({ success: false, error: { message: '주제를 찾을 수 없습니다.' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let prompt: string;

    if (sourceType === 'session') {
      const session = await getSessionData(topicId, sourceId);
      if (!session) {
        return new Response(JSON.stringify({ success: false, error: { message: '학습 세션을 찾을 수 없습니다.' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      prompt = getTechNoteFromSessionPrompt(session, topic.name);
    } else if (sourceType === 'diagnosis') {
      const diagnosis = await getDiagnosisData(topicId);
      if (!diagnosis) {
        return new Response(JSON.stringify({ success: false, error: { message: '수준진단 결과를 찾을 수 없습니다.' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Try to get diagnosis session messages for richer content
      const diagSession = await getDiagnosisSessionData(topicId);
      const sessionMessages = diagSession?.messages
        ?.filter((m) => m.role === 'assistant')
        .map((m) => m.content)
        .join('\n\n---\n\n') || null;
      prompt = getTechNoteFromDiagnosisPrompt(diagnosis, sessionMessages, topic.name);
    } else {
      const test = await getTestData(topicId, sourceId);
      if (!test) {
        return new Response(JSON.stringify({ success: false, error: { message: '테스트 결과를 찾을 수 없습니다.' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      prompt = getTechNoteFromTestPrompt(test, topic.name);
    }

    const systemPrompt = '당신은 기술 블로그 작성 전문가입니다. 학습 내용을 빠르게 복습할 수 있도록 체계적으로 정리된 마크다운 문서를 작성합니다. 마크다운만 출력하세요.';

    const stream = createClaudeStream(prompt, systemPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: { message: '기술 정리 생성에 실패했습니다.' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
