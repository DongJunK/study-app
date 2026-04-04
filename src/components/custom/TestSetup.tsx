"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Brain, ListChecks, PenLine } from "lucide-react";
import type { TestType } from "@/types/test";

interface TestSetupProps {
  topicId: string;
  topicName: string;
  onStart: (type: TestType, duration: number) => void;
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

const DURATIONS = [
  { value: 5, label: "5분" },
  { value: 15, label: "15분" },
  { value: 30, label: "30분" },
];

export function TestSetup({ topicId: _topicId, topicName, onStart }: TestSetupProps) {
  const [selectedType, setSelectedType] = React.useState<TestType | null>(null);
  const [selectedDuration, setSelectedDuration] = React.useState(15);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{topicName} 테스트</h1>
        <p className="mt-2 text-muted-foreground">
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

      {/* Duration selection */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          제한 시간
        </h2>
        <div className="flex items-center gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDuration(d.value)}
              className={`rounded-lg border px-6 py-2.5 text-sm font-medium transition-all ${
                selectedDuration === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center pt-4">
        <Button
          disabled={!selectedType}
          onClick={() => selectedType && onStart(selectedType, selectedDuration)}
          className="px-8"
          size="lg"
        >
          테스트 시작
        </Button>
      </div>
    </div>
  );
}
