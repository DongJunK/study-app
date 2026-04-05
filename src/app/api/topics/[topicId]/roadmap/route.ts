import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTopic } from '@/lib/data/topicManager';
import { getRoadmap, saveRoadmap } from '@/lib/data/roadmapManager';
import { askClaude } from '@/lib/claude/client';
import { getRoadmapPrompt } from '@/lib/prompts/roadmap';
import type { RoadmapItem } from '@/types/topic';
import { v4 } from '@/lib/data/idUtils';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/roadmap'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '주제를 찾을 수 없습니다.',
            code: 'TOPIC_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    const roadmap = await getRoadmap(topicId);
    return NextResponse.json({ success: true, data: roadmap });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '로드맵을 불러오는데 실패했습니다.',
          code: 'ROADMAP_FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/roadmap'>
) {
  try {
    const { topicId } = await ctx.params;
    const topic = await getTopic(topicId);

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '주제를 찾을 수 없습니다.',
            code: 'TOPIC_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { diagnosisResult, additionalTopics } = body;

    if (!diagnosisResult || typeof diagnosisResult !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '진단 결과가 필요합니다.',
            code: 'INVALID_DIAGNOSIS',
          },
        },
        { status: 400 }
      );
    }

    const prompt = getRoadmapPrompt(topic.name, diagnosisResult, additionalTopics || []);
    const response = await askClaude(prompt);

    // Parse roadmap JSON from response
    let roadmapData: { items: Array<{ title: string; order: number; description?: string }> };
    try {
      const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response.text;
      roadmapData = JSON.parse(jsonStr.trim());
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '로드맵 생성 결과를 파싱하는데 실패했습니다.',
            code: 'ROADMAP_PARSE_ERROR',
          },
        },
        { status: 500 }
      );
    }

    const items: RoadmapItem[] = roadmapData.items.map((item, index) => ({
      id: v4(),
      title: item.title,
      order: item.order || index + 1,
      status: index === 0 ? 'available' : 'locked',
      isCustom: false,
    }));

    const roadmap = {
      topicId,
      items,
      currentItemIndex: 0,
    };

    await saveRoadmap(topicId, roadmap);

    return NextResponse.json({ success: true, data: roadmap }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '로드맵을 생성하는데 실패했습니다.',
          code: 'ROADMAP_CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/topics/[topicId]/roadmap'>
) {
  try {
    const { topicId } = await ctx.params;
    const body = await request.json();

    const existingRoadmap = await getRoadmap(topicId);
    if (!existingRoadmap) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '로드맵을 찾을 수 없습니다.',
            code: 'ROADMAP_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Add a new custom item
    if (body.addItem && typeof body.addItem.title === 'string') {
      const newItem: RoadmapItem = {
        id: v4(),
        title: body.addItem.title,
        order: existingRoadmap.items.length + 1,
        status: 'locked',
        isCustom: true,
      };
      existingRoadmap.items.push(newItem);
    }

    // Update a single item's status
    if (body.updateItemStatus && typeof body.updateItemStatus.itemId === 'string') {
      const { itemId, status } = body.updateItemStatus as {
        itemId: string;
        status: RoadmapItem['status'];
      };
      const itemIndex = existingRoadmap.items.findIndex((i) => i.id === itemId);
      if (itemIndex >= 0) {
        existingRoadmap.items[itemIndex] = {
          ...existingRoadmap.items[itemIndex],
          status,
        };

        // If completed, unlock the next locked item
        if (status === 'completed') {
          const completedOrder = existingRoadmap.items[itemIndex].order;
          const sorted = [...existingRoadmap.items].sort((a, b) => a.order - b.order);
          const nextLocked = sorted.find(
            (i) => i.status === 'locked' && i.order > completedOrder
          );
          if (nextLocked) {
            const nextIdx = existingRoadmap.items.findIndex(
              (i) => i.id === nextLocked.id
            );
            if (nextIdx >= 0) {
              existingRoadmap.items[nextIdx] = {
                ...existingRoadmap.items[nextIdx],
                status: 'available',
              };
            }
          }
        }
      }
    }

    // Update items order if provided
    if (Array.isArray(body.items)) {
      existingRoadmap.items = body.items;
    }

    // Update currentItemIndex
    if (typeof body.currentItemIndex === 'number') {
      existingRoadmap.currentItemIndex = body.currentItemIndex;
    }

    await saveRoadmap(topicId, existingRoadmap);

    return NextResponse.json({ success: true, data: existingRoadmap });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '로드맵을 수정하는데 실패했습니다.',
          code: 'ROADMAP_UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
