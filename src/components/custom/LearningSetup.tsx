"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Presentation, Check } from "lucide-react";
import type { LearningMode, ContentFormat } from "@/types/session";

interface LearningSetupProps {
  topicId: string;
  conceptTitle: string;
  onStart: (mode: LearningMode, formats: ContentFormat[]) => void;
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

export function LearningSetup({ topicId, conceptTitle, onStart }: LearningSetupProps) {
  const [selectedFormats, setSelectedFormats] = React.useState<ContentFormat[]>(["text"]);
  const [selectedMode, setSelectedMode] = React.useState<LearningMode | null>(null);

  function toggleFormat(format: ContentFormat) {
    setSelectedFormats((prev) => {
      if (prev.includes(format)) {
        // Keep at least one format selected
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">{conceptTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          학습 방식과 콘텐츠 형식을 선택하세요
        </p>
      </div>

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
        <div className="grid gap-3 sm:grid-cols-2">
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
          학습 시작
        </Button>
      </div>
    </div>
  );
}
