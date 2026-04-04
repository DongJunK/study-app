"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface SessionSummaryProps {
  learned: string[];
  uncertain: string[];
  nextSteps: string[];
  onContinue: () => void;
  onDashboard: () => void;
}

export function SessionSummary({
  learned,
  uncertain,
  nextSteps,
  onContinue,
  onDashboard,
}: SessionSummaryProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">학습 세션 완료</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          오늘의 학습 요약입니다
        </p>
      </div>

      <div className="space-y-6">
        {/* Learned */}
        {learned.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              <h3 className="font-semibold text-emerald-500">
                오늘 배운 것 ({learned.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {learned.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uncertain */}
        {uncertain.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              <h3 className="font-semibold text-amber-500">
                아직 불확실한 부분 ({uncertain.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {uncertain.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        {nextSteps.length > 0 && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ArrowRight className="size-5 text-blue-500" />
              <h3 className="font-semibold text-blue-500">
                다음에 학습할 내용 ({nextSteps.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button variant="outline" onClick={onDashboard}>
          대시보드로
        </Button>
        <Button onClick={onContinue}>계속 학습</Button>
      </div>
    </div>
  );
}
