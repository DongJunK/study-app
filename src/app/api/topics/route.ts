import { NextResponse } from 'next/server';
import { getAllTopics, createTopic } from '@/lib/data/topicManager';

export async function GET() {
  try {
    const topics = await getAllTopics();
    return NextResponse.json({ success: true, data: topics });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '주제 목록을 불러오는데 실패했습니다.', code: 'TOPICS_FETCH_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: '주제 이름을 입력해주세요.', code: 'INVALID_NAME' } },
        { status: 400 }
      );
    }

    const existing = await getAllTopics();
    const trimmedName = name.trim().toLowerCase();
    if (existing.some((t) => t.name.toLowerCase() === trimmedName)) {
      return NextResponse.json(
        { success: false, error: { message: '이미 등록된 주제입니다.', code: 'DUPLICATE_TOPIC' } },
        { status: 409 }
      );
    }

    const topic = await createTopic(name.trim());
    return NextResponse.json({ success: true, data: topic }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '주제를 생성하는데 실패했습니다.', code: 'TOPIC_CREATE_ERROR' } },
      { status: 500 }
    );
  }
}
