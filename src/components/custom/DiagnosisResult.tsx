"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, CheckCircle, AlertTriangle, Send } from "lucide-react";

interface DiagnosisData {
  level: string;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

interface DiagnosisResultProps {
  result: string; // JSON string
  topicName: string;
  onGenerateRoadmap: (additionalTopics: string[]) => void;
  onRestart: () => void;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  advanced: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export function DiagnosisResult({ result, topicName, onGenerateRoadmap, onRestart }: DiagnosisResultProps) {
  const [additionalInput, setAdditionalInput] = React.useState("");
  const [additionalTopics, setAdditionalTopics] = React.useState<string[]>([]);
  const isComposingRef = React.useRef(false);

  let data: DiagnosisData | null = null;
  try {
    data = JSON.parse(result);
  } catch {
    // invalid
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">진단 결과를 파싱할 수 없습니다.</p>
        <Button onClick={onRestart} className="mt-4">다시 진단하기</Button>
      </div>
    );
  }

  function handleAddTopic() {
    const trimmed = additionalInput.trim();
    if (!trimmed) return;
    setAdditionalTopics((prev) => [...prev, trimmed]);
    setAdditionalInput("");
  }

  function handleRemoveTopic(index: number) {
    setAdditionalTopics((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleAddTopic();
    }
  }

  function handleGenerate() {
    onGenerateRoadmap(additionalTopics);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">{topicName} 수준 진단 결과</h2>
        <Badge className={`text-sm px-3 py-1 ${LEVEL_COLOR[data.level] || ""}`}>
          {LEVEL_LABEL[data.level] || data.level}
        </Badge>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="size-4 text-emerald-500" />
          잘하고 있는 부분
        </h3>
        <div className="space-y-2">
          {data.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 px-4 py-2.5">
              <span className="text-emerald-500 mt-0.5 text-sm">✓</span>
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses = 학습이 필요한 부분 */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          학습이 필요한 부분
        </h3>
        <div className="space-y-2">
          {data.weaknesses.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 px-4 py-2.5">
              <span className="text-amber-500 mt-0.5 text-sm">!</span>
              <span className="text-sm">{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional topics input */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="text-base font-semibold mb-2">추가로 학습하고 싶은 부분이 있나요?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          입력하신 내용은 학습 로드맵에 함께 반영됩니다. 없으면 바로 로드맵을 생성하세요.
        </p>

        {/* Added topics */}
        {additionalTopics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {additionalTopics.map((t, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {t}
                <button
                  onClick={() => handleRemoveTopic(i)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={additionalInput}
            onChange={(e) => setAdditionalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder="예: Flow 심화, 코루틴 에러 핸들링..."
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button size="sm" variant="outline" onClick={handleAddTopic} disabled={!additionalInput.trim()}>
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="size-4" />
          다시 진단하기
        </Button>
        <Button onClick={handleGenerate} className="gap-2" size="lg">
          <Sparkles className="size-4" />
          {additionalTopics.length > 0
            ? `로드맵 생성 (추가 ${additionalTopics.length}개 포함)`
            : "로드맵 생성"
          }
        </Button>
      </div>
    </div>
  );
}
