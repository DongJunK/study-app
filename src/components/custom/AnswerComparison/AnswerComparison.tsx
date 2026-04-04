"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send } from "lucide-react";

interface AnswerComparisonProps {
  userAnswer: string;
  modelAnswer: string;
  gaps: string[];
  feedback: string;
  onFollowUp: (question: string) => void;
}

export function AnswerComparison({
  userAnswer,
  modelAnswer,
  gaps,
  feedback,
  onFollowUp,
}: AnswerComparisonProps) {
  const [question, setQuestion] = React.useState("");

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onFollowUp(trimmed);
    setQuestion("");
  }

  return (
    <div className="space-y-6">
      {/* Two-column comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User answer */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            내 답변
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {userAnswer}
          </p>
        </div>

        {/* Model answer */}
        <div className="rounded-xl border-2 border-primary/30 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-primary">
            모범답안
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {modelAnswer}
          </p>
        </div>
      </div>

      {/* Gap analysis */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            당신의 답변에서 빠진 핵심 포인트
          </h3>
          <ul className="space-y-2">
            {gaps.map((gap, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="rounded-xl border border-border bg-muted/50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            종합 피드백
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {feedback}
          </p>
        </div>
      )}

      {/* Follow-up question input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          모범답안에 대해 궁금한 점이 있나요?
        </h3>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="모범답안에 대해 질문하세요..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim()}
            className="shrink-0 rounded-lg"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
