# Study App

> Claude CLI 기반 로컬 학습 시스템. 기술 개념을 단순히 읽는 것이 아니라, AI와의 대화를 통해 깊이 이해하고 검증하는 것에 초점을 맞춘 개인 학습 도구.

## Why

개발자의 기술 학습은 대부분 "읽고 잊는" 사이클을 반복한다. 문서를 읽고, 블로그를 보고, 강의를 들어도 시간이 지나면 같은 내용을 다시 찾게 된다. 이 앱은 그 문제를 구조적으로 해결한다.

- **능동적 학습**: 소크라테스 문답법과 파인만 기법으로 수동적 읽기를 능동적 사고로 전환
- **이해도 검증**: 꼬리질문 기반 심층 테스트로 "안다고 착각하는 것"과 "진짜 아는 것"을 구분
- **약점 추적**: 학습/테스트 결과에서 약점을 자동 분류하고, 시간이 지나도 데이터가 축적
- **완전 로컬**: 모든 데이터는 로컬 파일시스템에 저장. 외부 전송 없음. Private 레포 분석도 안전

## How It Works

```
주제 입력 → 수준 진단 → 로드맵 생성 → 학습 (소크라테스/파인만) → 테스트 → 약점 보강 → 반복
```

Claude CLI를 AI 엔진으로 사용하며, 구독 플랜 토큰을 소비한다. API 키나 별도 과금 없음.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | SSR 불필요하지만, API Routes + 파일시스템 접근이 필요 |
| Language | TypeScript (strict) | 타입 안정성 |
| Styling | Tailwind CSS + shadcn/ui | 빠른 UI 개발 + 커스텀 자유도 |
| Font | Pretendard Variable | 한글/영문 통합, 가변 폰트 |
| State | zustand | 보일러플레이트 최소, 선택적 구독 |
| AI | Claude CLI (child_process) | 구독 플랜 토큰 사용, API 비용 없음 |
| DB | 없음 (JSON/Markdown 파일) | 로컬 전용이므로 DB 오버헤드 불필요 |
| Theme | Light/Dark 토글 | next-themes |

## Getting Started

```bash
npm install
npm run dev
```

**사전 요구사항**: Node.js 18+, Claude CLI 설치 및 로그인 (`claude --version`으로 확인)

## Project Structure

```
src/
├── app/                      # Pages + API Routes
│   ├── page.tsx              # 대시보드 (스탯 카드 + 주제 그리드)
│   ├── learn/                # 수준진단 → 로드맵 → 소크라테스/파인만 학습
│   ├── test/                 # 깊은 학습 시뮬레이션 + 객관식/주관식
│   ├── topic/[topicId]/      # 주제 상세 (이력, 그래프, 수준)
│   ├── weakness/             # 약점 목록 + 집중 학습
│   └── api/                  # 15+ Route Handlers
├── lib/
│   ├── claude/               # Claude CLI 래퍼 (스트리밍 SSE 지원)
│   ├── data/                 # 파일 기반 데이터 계층 (topic, session, test, weakness, growth)
│   └── prompts/              # 프롬프트 템플릿 (진단, 소크라테스, 파인만, 테스트 등)
├── components/
│   ├── ui/                   # shadcn/ui
│   └── custom/               # StreamingChat, TopicCard, ScoreIndicator 등
├── stores/                   # zustand (topic, session, test, weakness)
└── types/                    # 공유 타입
data/                         # 학습 데이터 (gitignore 대상)
└── topics/{id}/              # meta.json, roadmap.json, weaknesses.json, sessions/, tests/
```

## Architecture Decisions

- **Claude CLI를 child_process.spawn으로 호출**: `--output-format stream-json --verbose --include-partial-messages` 플래그로 실시간 토큰 스트리밍. SSE로 프론트엔드에 전달.
- **파일 기반 데이터**: DB 대신 JSON/Markdown. 주제별 디렉토리 격리. 읽기/쓰기 모두 500ms 이내.
- **프롬프트 분리 관리**: `src/lib/prompts/`에 목적별 프롬프트 템플릿. 대화 히스토리는 시스템 프롬프트에 구조화된 태그로 주입하여 Claude가 사용자 역할을 생성하지 않도록 제어.
- **모듈 경계**: `api/ → lib/`만 호출. `lib/claude/`는 SDK 래핑만. `lib/data/`는 파일 I/O만. 컴포넌트에서 직접 파일 접근 금지.

## Data Flow

```
User → Page Component → zustand Store → API Route → lib/data (File I/O)
                                                   → lib/claude (AI)
                                                   → lib/prompts (Template)
```

## Features

### MVP (현재)
- 주제 관리 + 대시보드 (스탯 카드, 주제 카드)
- 수준진단 (AI 대화형, 세션 영구 저장)
- 자동 로드맵 생성 + 커스텀 항목 추가
- 소크라테스 / 파인만 학습 모드
- 깊은 학습 시뮬레이션 (꼬리질문 + 실시간 점수/합격선)
- 객관식 / 주관식 퀴즈
- 모범답안 비교 + 갭 분석 + 후속 Q&A (자동 학습 반영)
- 약점 자동 분류 + 집중 학습 + 퀵 퀴즈
- 세션 이어하기 + 성장 추적
- 주제 상세 페이지 (이력, 그래프, 수준 정보)
- 라이트/다크 테마 토글

### Planned
- 적응형 난이도 조절
- 망각 곡선 기반 복습
- GitHub 레포 연동 (Private 포함)
- 스트릭 / 레벨업 / 자기경쟁
- 블로그 게시물 자동 생성

## License

Private. Personal use only.
