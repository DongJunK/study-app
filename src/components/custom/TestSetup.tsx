"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Brain, ListChecks, PenLine, ClipboardCheck } from "lucide-react";
import type { TestType } from "@/types/test";

interface TestSetupProps {
  topicId: string;
  topicName: string;
  onStart: (type: TestType) => void;
  topicNames?: string[];
}

const TEST_TYPES: Array<{
  type: TestType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: "deep-learning",
    label: "깊은 학습 시뮬레이션",
    description: "꼬리질문 포함 심층 검증",
    icon: <Brain className="size-6" />,
  },
  {
    type: "multiple-choice",
    label: "객관식 퀴즈",
    description: "4지선다",
    icon: <ListChecks className="size-6" />,
  },
  {
    type: "short-answer",
    label: "주관식 퀴즈",
    description: "서술형 답변",
    icon: <PenLine className="size-6" />,
  },
];

export function TestSetup({ topicId: _topicId, topicName, onStart, topicNames = [] }: TestSetupProps) {
  const [selectedType, setSelectedType] = React.useState<TestType | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-3">
          <ClipboardCheck className="size-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">테스트</h1>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
          {(topicNames.length > 0 ? topicNames : [topicName]).map((n) => (
            <span key={n} className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">{n}</span>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          테스트 유형과 시간을 선택하세요
        </p>
      </div>

      {/* Test type selection */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          테스트 유형
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEST_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => setSelectedType(item.type)}
              className={`flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 ${
                selectedType === item.type
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div
                className={`rounded-lg p-2 ${
                  selectedType === item.type
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.icon}
              </div>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Test info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">점수 기준</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/5 px-3 py-2">
              <span className="font-medium text-red-600 dark:text-red-400">1-3점</span>
              <span className="text-muted-foreground">기본 개념 이해 부족</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 px-3 py-2">
              <span className="font-medium text-amber-600 dark:text-amber-400">4-6점</span>
              <span className="text-muted-foreground">기본은 알지만 깊이 부족</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-500/5 px-3 py-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">7-8점</span>
              <span className="text-muted-foreground">좋은 이해도, 실무 적용 가능</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 px-3 py-2">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">9-10점</span>
              <span className="text-muted-foreground">전문가 수준</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">테스트 안내</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#10003;</span> 최소 10문제 이상 답변해야 테스트를 완료할 수 있습니다</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#10003;</span> 7점 이상이면 합격입니다</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#10003;</span> AI가 답변을 평가하고 꼬리질문으로 깊이를 검증합니다</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#10003;</span> 제한 시간 없이 자유롭게 진행할 수 있습니다</li>
          </ul>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center pt-4">
        <Button
          disabled={!selectedType}
          onClick={() => selectedType && onStart(selectedType)}
          className="px-8"
          size="lg"
        >
          테스트 시작
        </Button>
      </div>
    </div>
  );
}
