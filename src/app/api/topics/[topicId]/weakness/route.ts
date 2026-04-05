import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getWeaknesses,
  classifyWeaknesses,
  updateWeaknessStatus,
} from '@/lib/data/weaknessManager';
import { recordWeaknessChange } from '@/lib/data/growthManager';
import type { WeaknessStatus } from '@/types/weakness';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/weakness'>
) {
  try {
    const { topicId } = await ctx.params;
    const weaknesses = await getWeaknesses(topicId);
    return NextResponse.json({ success: true, data: weaknesses });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: '약점 목록을 불러오는데 실패했습니다.', code: 'WEAKNESS_FETCH_ERROR' },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/weakness'>
) {
  try {
    const { topicId } = await ctx.params;
    const body = await request.json();
    const { weaknesses } = body as {
      weaknesses: Array<{ concept: string; status: WeaknessStatus }>;
    };

    if (!weaknesses || !Array.isArray(weaknesses)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'weaknesses 배열이 필요합니다.', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    await classifyWeaknesses(topicId, weaknesses);
    const updated = await getWeaknesses(topicId);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: '약점을 분류하는데 실패했습니다.', code: 'WEAKNESS_CLASSIFY_ERROR' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/weakness'>
) {
  try {
    const { topicId } = await ctx.params;
    const body = await request.json();
    const { weaknessId, status } = body as {
      weaknessId: string;
      status: WeaknessStatus;
    };

    if (!weaknessId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'weaknessId와 status가 필요합니다.', code: 'INVALID_PARAMS' },
        },
        { status: 400 }
      );
    }

    // Find current status before update
    const before = await getWeaknesses(topicId);
    const target = before.find((w) => w.id === weaknessId);
    const oldStatus = target?.status ?? "unknown";

    await updateWeaknessStatus(topicId, weaknessId, status);

    // Record growth change
    try {
      if (target) {
        await recordWeaknessChange(topicId, target.concept, oldStatus, status);
      }
    } catch {
      // Growth recording failure should not block weakness update
    }

    const updated = await getWeaknesses(topicId);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: '약점 상태를 업데이트하는데 실패했습니다.', code: 'WEAKNESS_UPDATE_ERROR' },
      },
      { status: 500 }
    );
  }
}
