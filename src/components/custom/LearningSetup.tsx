"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Presentation, Check, History, BookOpen, RotateCcw } from "lucide-react";
import type { LearningMode, ContentFormat } from "@/types/session";

interface LastSessionInfo {
  sessionId: string;
  mode: LearningMode;
  formats: ContentFormat[];
  date: string;
}

interface LearningSetupProps {
  topicId: string;
  conceptTitle: string;
  onStart: (mode: LearningMode, formats: ContentFormat[]) => void;
  onResumeLast?: (sessionId: string, mode: LearningMode, formats: ContentFormat[]) => void;
  isReview?: boolean;
  reviewQuestionCount?: number;
}

const FORMAT_OPTIONS: { value: ContentFormat; label: string; description: string }[] = [
  { value: "text", label: "텍스트", description: "개념 설명" },
  { value: "code", label: "코드", description: "코드 예제" },
  { value: "diagram", label: "다이어그램", description: "시각적 구조" },
  { value: "analogy", label: "비유", description: "실생활 예시" },
];

const MODE_OPTIONS: {
  value: LearningMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "basic",
    label: "기본형",
    description: "AI가 개념을 설명하고, 질문하며 자유롭게 대화하는 학습",
    icon: BookOpen,
  },
  {
    value: "socratic",
    label: "소크라테스",
    description: "질문을 통해 스스로 답을 찾아가는 대화형 학습",
    icon: MessageCircleQuestion,
  },
  {
    value: "feynman",
    label: "파인만 기법",
    description: "개념을 직접 설명하며 이해도를 검증하는 학습",
    icon: Presentation,
  },
];

const MODE_LABEL: Record<string, string> = { basic: "기본형", socratic: "소크라테스", feynman: "파인만 기법" };
const FORMAT_LABEL: Record<string, string> = { text: "텍스트", code: "코드", diagram: "다이어그램", analogy: "비유" };

export function LearningSetup({ topicId, conceptTitle, onStart, onResumeLast, isReview, reviewQuestionCount }: LearningSetupProps) {
  const [selectedFormats, setSelectedFormats] = React.useState<ContentFormat[]>(["text"]);
  const [selectedMode, setSelectedMode] = React.useState<LearningMode | null>(null);
  const [lastSession, setLastSession] = React.useState<LastSessionInfo | null>(null);

  // Fetch last session for this topic + concept
  React.useEffect(() => {
    async function fetchLastSession() {
      try {
        const res = await fetch(`/api/topics/${topicId}/detail`);
        const json = await res.json();
        if (json.success && json.data.recentSessions?.length > 0) {
          const latest = json.data.recentSessions[0];
          // Try to read the full session to get mode/formats
          const sessionRes = await fetch(`/api/learn/session?topicId=${topicId}&sessionId=${latest.id}`);
          const sessionJson = await sessionRes.json();
          if (sessionJson.success && sessionJson.data) {
            const s = sessionJson.data;
            setLastSession({
              sessionId: s.id,
              mode: s.mode,
              formats: s.formats,
              date: s.startedAt || latest.date,
            });
          }
        }
      } catch {
        // ignore
      }
    }
    fetchLastSession();
  }, [topicId]);

  function toggleFormat(format: ContentFormat) {
    setSelectedFormats((prev) => {
      if (prev.includes(format)) {
        if (prev.length === 1) return prev;
        return prev.filter((f) => f !== format);
      }
      return [...prev, format];
    });
  }

  function handleStart() {
    if (!selectedMode) return;
    onStart(selectedMode, selectedFormats);
  }

  function handleResume() {
    if (!lastSession || !onResumeLast) return;
    onResumeLast(lastSession.sessionId, lastSession.mode, lastSession.formats);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        {isReview && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            <RotateCcw className="size-3" />
            복습 모드{reviewQuestionCount ? ` · 질문 ${reviewQuestionCount}개` : ''}
          </div>
        )}
        <h2 className="text-2xl font-bold">{conceptTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isReview ? '복습 학습 방식과 콘텐츠 형식을 선택하세요' : '학습 방식과 콘텐츠 형식을 선택하세요'}
        </p>
      </div>

      {/* Resume last session */}
      {lastSession && onResumeLast && (
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <History className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">지난 학습 이어서 하기</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {MODE_LABEL[lastSession.mode] || lastSession.mode} · {lastSession.formats.map(f => FORMAT_LABEL[f] || f).join(", ")} · {new Date(lastSession.date).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleResume} className="gap-1.5">
              <History className="size-3.5" />
              이어하기
            </Button>
          </div>
        </div>
      )}

      {/* Content format selection */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">콘텐츠 형식</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMAT_OPTIONS.map((opt) => {
            const isSelected = selectedFormats.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleFormat(opt.value)}
                className={`relative rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {isSelected && (
                  <Check className="absolute right-2 top-2 size-3.5 text-primary" />
                )}
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Learning mode selection */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">학습 모드</h3>
        <div className="grid gap-3 grid-cols-1">
          {MODE_OPTIONS.map((opt) => {
            const isSelected = selectedMode === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedMode(opt.value)}
                className={`rounded-xl border p-5 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{opt.label}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <div className="text-center">
        <Button
          size="lg"
          disabled={!selectedMode}
          onClick={handleStart}
          className="min-w-[200px]"
        >
          {isReview ? '복습 시작' : '새 학습 시작'}
        </Button>
      </div>
    </div>
  );
}
