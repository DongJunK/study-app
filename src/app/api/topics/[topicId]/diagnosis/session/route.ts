import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getDiagnosisSession,
  saveDiagnosisSession,
  deleteDiagnosisSession,
} from '@/lib/data/diagnosisSessionManager';
import type { Message } from '@/types/session';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis/session'>
) {
  try {
    const { topicId } = await ctx.params;
    const session = await getDiagnosisSession(topicId);
    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '진단 세션을 불러오는데 실패했습니다.',
          code: 'DIAGNOSIS_SESSION_GET_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis/session'>
) {
  try {
    const { topicId } = await ctx.params;
    const body = await req.json() as {
      messages: Message[];
      isComplete: boolean;
      result: string | null;
    };

    await saveDiagnosisSession(topicId, {
      topicId,
      messages: body.messages,
      isComplete: body.isComplete,
      result: body.result,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '진단 세션을 저장하는데 실패했습니다.',
          code: 'DIAGNOSIS_SESSION_SAVE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/diagnosis/session'>
) {
  try {
    const { topicId } = await ctx.params;
    await deleteDiagnosisSession(topicId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '진단 세션을 삭제하는데 실패했습니다.',
          code: 'DIAGNOSIS_SESSION_DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
