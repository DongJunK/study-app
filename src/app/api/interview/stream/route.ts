import fs from 'fs/promises';
import path from 'path';
import { createClaudeStream } from '@/lib/claude/stream';
import { getInterviewSystemPrompt } from '@/lib/prompts/interview';

export async function POST() {
  try {
    const tempDir = path.join(process.cwd(), 'data', 'temp');
    const entries = await fs.readdir(tempDir).catch(() => []);
    const mdFiles = (entries as string[]).filter((f: string) => f.endsWith('.md'));

    if (mdFiles.length === 0) {
      return Response.json(
        {
          success: false,
          error: { message: '이력서 파일을 찾을 수 없습니다.', code: 'NO_RESUME' },
        },
        { status: 404 }
      );
    }

    // Read all md files and concatenate
    const resumeParts: string[] = [];
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(tempDir, file), 'utf-8');
      resumeParts.push(content);
    }
    const resumeContent = resumeParts.join('\n\n---\n\n');

    const systemPrompt = getInterviewSystemPrompt(resumeContent);

    const stream = createClaudeStream(
      '면접을 시작합니다. 이력서를 검토하고 첫 번째 질문을 해주세요.',
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
          message: '면접 스트리밍을 시작하는데 실패했습니다.',
          code: 'STREAM_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
