import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTechNoteContent, deleteTechNote, saveTechNote, getTechNotes } from '@/lib/data/techNoteManager';
import type { TechNote } from '@/types/technote';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]/[noteId]'>
) {
  try {
    const { topicId, noteId } = await ctx.params;
    const content = await getTechNoteContent(topicId, noteId);

    if (content === null) {
      return NextResponse.json(
        { success: false, error: { message: '기술 정리를 찾을 수 없습니다.', code: 'TECHNOTE_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Find note metadata
    const notes = await getTechNotes(topicId);
    const note = notes.find((n) => n.id === noteId);

    return NextResponse.json({ success: true, data: { content, note } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '기술 정리를 불러오는데 실패했습니다.', code: 'TECHNOTE_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]/[noteId]'>
) {
  try {
    const { topicId, noteId } = await ctx.params;
    const { markdown, title, tags, sourceType, sourceId } = await request.json() as {
      markdown: string;
      title: string;
      tags: string[];
      sourceType: 'session' | 'test';
      sourceId: string;
    };

    if (!markdown || !title) {
      return NextResponse.json(
        { success: false, error: { message: 'markdown과 title이 필요합니다.' } },
        { status: 400 }
      );
    }

    const note: TechNote = {
      id: noteId,
      topicId,
      title,
      sourceType,
      sourceId,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    await saveTechNote(topicId, note, markdown);

    return NextResponse.json({ success: true, data: note });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '기술 정리 저장에 실패했습니다.', code: 'TECHNOTE_SAVE_ERROR' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/technotes/[topicId]/[noteId]'>
) {
  try {
    const { topicId, noteId } = await ctx.params;
    await deleteTechNote(topicId, noteId);
    return NextResponse.json({ success: true, data: { id: noteId } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '기술 정리 삭제에 실패했습니다.', code: 'TECHNOTE_DELETE_ERROR' } },
      { status: 500 }
    );
  }
}
