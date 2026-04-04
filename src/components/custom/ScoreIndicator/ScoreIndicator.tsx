"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface ScoreIndicatorProps {
  currentScore: number;
  maxScore: number;
  passThreshold: number;
  answers: Array<{ score: number; maxScore: number; passed: boolean }>;
}

export function ScoreIndicator({
  currentScore,
  maxScore,
  passThreshold,
  answers,
}: ScoreIndicatorProps) {
  const percentage = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
  const thresholdPercentage = Math.round(passThreshold * 100);

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return "text-green-600 dark:text-green-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBarColor = (pct: number) => {
    if (pct >= 70) return "bg-green-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full space-y-4 p-4">
      <h3 className="text-sm font-semibold text-muted-foreground">점수 현황</h3>

      {/* Cumulative score */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
            {currentScore}
          </span>
          <span className="text-sm text-muted-foreground">/ {maxScore}</span>
        </div>

        <div className="relative">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${getBarColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Pass threshold line */}
          <div
            className="absolute top-0 h-3 w-0.5 bg-foreground/60"
            style={{ left: `${thresholdPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{percentage}%</span>
          <span>합격선: {thresholdPercentage}%</span>
        </div>
      </div>

      {/* Per-answer scores */}
      {answers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">답변별 점수</h4>
          <div className="space-y-1.5">
            {answers.map((answer, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-sm">
                  질문 {idx + 1}:{" "}
                  <span className="font-medium">
                    {answer.score}/{answer.maxScore}
                  </span>
                </span>
                <Badge
                  variant={answer.passed ? "default" : "destructive"}
                  className="text-xs"
                >
                  {answer.passed ? "통과" : "미달"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
