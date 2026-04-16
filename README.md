# Study App

> Claude CLI 기반 로컬 학습 시스템. 기술 개념을 단순히 읽는 것이 아니라, AI와의 대화를 통해 깊이 이해하고 검증하는 것에 초점을 맞춘 개인 학습 도구.

## 사용 방법

### 1. 설치 및 실행

```bash
# 사전 요구사항
# - Node.js 18+
# - Claude CLI 설치 및 로그인 (claude --version 으로 확인)

git clone https://github.com/DongJunK/study-app.git
cd study-app
npm install

# 개발 모드
npm run dev

# 프로덕션 모드
npm run build && npm run start
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 2. 학습 플로우

```
주제 추가 → 수준 진단 → 로드맵 생성 → 학습 → 테스트 → 약점 보강 → 반복
```

1. **대시보드**에서 `+ 새 주제 추가`로 학습할 기술 주제를 등록
2. **수준 진단** — AI가 5~7개 질문으로 현재 수준을 파악
3. **로드맵 생성** — 진단 결과 기반으로 학습 로드맵 자동 생성 (항목 추가 가능)
4. **학습** — 소크라테스(질문 유도) 또는 파인만(설명 검증) 모드 선택
5. **테스트** — 깊은 학습 시뮬레이션(꼬리질문), 객관식, 주관식 중 선택
6. **약점 보강** — 자동 분류된 약점을 집중 학습 + 퀴즈로 극복
7. **Q&A** — 학습 데이터 기반으로 AI에게 자유롭게 질문
8. **기술 정리** — 학습/테스트/수준진단 내용을 마크다운 기술 블로그로 정리하여 빠르게 복습

### 3. 설정

설정 페이지에서 다음을 변경할 수 있습니다:
- **테마** — 라이트 / 다크 / 시스템
- **사이드바 모드** — 사이드바(아이콘+메뉴명) / 아이콘바(아이콘만)
- **학습 로드맵 노출 방식** — 타임라인 / 카드뷰
- **학습 로드맵 잠김** — 순서 강제 / 자유 학습

---

## AI 연동 방식

이 앱은 **Anthropic API를 직접 호출하지 않습니다.** 로컬에 설치된 Claude CLI를 `child_process.spawn`으로 호출하여 AI 기능을 구현합니다.

```
Next.js API Route → child_process.spawn('claude', [...args]) → Claude CLI → 구독 플랜 토큰 소비
```

- **API 키 불필요** — 로컬에 Claude CLI가 로그인되어 있으면 자동 연동
- **비용 구조** — Claude 구독 플랜의 토큰을 사용. 별도 API 과금 없음
- **스트리밍** — `--output-format stream-json --verbose --include-partial-messages` 플래그로 실시간 토큰 스트리밍. SSE(Server-Sent Events)로 프론트엔드에 전달
- **프롬프트 관리** — `src/lib/prompts/`에 목적별 템플릿 분리 (진단, 소크라테스, 파인만, 테스트, 약점 분류, 기술 정리 등 10개)
- **데이터 보안** — 모든 데이터는 로컬 파일시스템에만 저장. 외부 서버 전송 제로

---

## 기능 목록

### 현재 구현
- 주제 관리 + 대시보드 (스탯 카드, 주제 카드, 성장 추적)
- 수준진단 (AI 대화형, 세션 영구 저장, 재진단 가능)
- 자동 로드맵 생성 + 커스텀 항목 추가 (타임라인/카드뷰 전환)
- 소크라테스 / 파인만 학습 모드 (15분 마이크로 러닝)
- 깊은 학습 시뮬레이션 (꼬리질문 + 실시간 점수/합격선)
- 객관식 / 주관식 퀴즈 + 전체 주제 혼합 테스트
- 모범답안 비교 + 갭 분석 + 후속 Q&A (자동 학습 반영)
- 약점 자동 분류 + 집중 학습 + 퀵 퀴즈 + 역대 약점 조회
- 약점 감지 카운트 (detectedCount) — 반복되는 약점을 시스템이 인식
- 주제 상세 페이지 (학습/테스트 이력, 진행률 그래프, 수준 정보)
- AI Q&A — 학습 데이터 기반 자유 질문 (data 디렉토리 읽기/쓰기 가능)
- 기술 정리 — 학습 세션/테스트/수준진단을 소스로 AI가 마크다운 기술 블로그 생성
- 기술 정리 미리보기 팝업 — 생성 전 소스 내용 확인 (질문, 강점/약점, 점수 등)
- 세션 이어하기 + 성장 추적 (진도, 점수, 약점, 학습 시간, 스트릭)
- 라이트/다크/시스템 테마 + 사이드바 모드 설정
- 한글 IME 입력 호환 (compositionend 처리)

### Planned
- 적응형 난이도 조절
- 망각 곡선 기반 복습
- GitHub 레포 연동 (Private 포함)
- 스트릭 / 레벨업 / 자기경쟁
- ~~블로그 게시물 자동 생성~~ (기술 정리 탭으로 구현 완료)
- 음성 답변 기능 (Web Speech API → Whisper 로컬)

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | API Routes + 파일시스템 접근 |
| Language | TypeScript (strict) | 타입 안정성 |
| Styling | Tailwind CSS + shadcn/ui | 빠른 UI 개발 + 커스텀 자유도 |
| Font | Pretendard Variable | 한글/영문 통합 가변 폰트 |
| State | zustand (persist) | 보일러플레이트 최소, localStorage 영구 저장 |
| AI | Claude CLI (child_process) | 구독 플랜 토큰 사용, API 비용 없음 |
| Data | JSON/Markdown 파일 | 로컬 전용, DB 오버헤드 불필요 |
| Theme | next-themes | 라이트/다크/시스템 |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # 대시보드
│   ├── learn/                  # 수준진단 → 로드맵 → 학습
│   ├── test/                   # 테스트 (깊은 학습, 객관식, 주관식, 혼합)
│   ├── topic/[topicId]/        # 주제 상세 (이력, 그래프, 수준)
│   ├── weakness/               # 약점 추적 + 역대 약점
│   ├── qna/                    # AI Q&A
│   ├── technotes/              # 기술 정리 (주제별 카드뷰, 노트 리스트, 마크다운 뷰어)
│   ├── settings/               # 설정 (테마, 사이드바, 로드맵)
│   └── api/                    # 25+ Route Handlers
├── components/
│   ├── ui/                     # shadcn/ui
│   ├── custom/                 # StreamingChat, TopicCard, ScoreIndicator 등 15+ 커스텀
│   └── layout/                 # Sidebar, SidebarWrapper
├── lib/
│   ├── claude/                 # Claude CLI 래퍼 (client.ts, stream.ts)
│   ├── data/                   # 파일 기반 데이터 계층 (8개 매니저)
│   ├── prompts/                # AI 프롬프트 템플릿 (10개)
│   └── weakness/               # 약점 자동 분류 유틸
├── stores/                     # zustand (topic, session, test, weakness, settings)
└── types/                      # 공유 타입 (topic, session, test, weakness, technote, api)
data/                           # 학습 데이터 (gitignore)
└── topics/{id}/                # meta, roadmap, weaknesses, sessions, tests, technotes, growth, qna
```

## Architecture

```
User → Page → zustand Store → API Route → lib/data (File I/O)
                                         → lib/claude (spawn CLI)
                                         → lib/prompts (Template)
```

- **모듈 경계**: `api/ → lib/`만 호출. `lib/claude/`는 CLI 래핑만. `lib/data/`는 파일 I/O만. 컴포넌트에서 직접 파일 접근 금지.
- **파일 기반 데이터**: DB 대신 JSON/Markdown. 주제별 디렉토리 격리.
- **프롬프트 분리**: 대화 히스토리는 시스템 프롬프트에 구조화된 태그로 주입하여 Claude가 사용자 역할을 생성하지 않도록 제어.

## License

Private. Personal use only.
