"use client";

import { Button } from "@/components/ui/button";
import { PlayCircle, X } from "lucide-react";

interface ResumeCardProps {
  topicName: string;
  context: string;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumeCard({ topicName, context, onResume, onDismiss }: ResumeCardProps) {
  return (
    <div className="relative rounded-2xl border-2 border-primary bg-card p-6 mb-8">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="닫기"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-full bg-primary/10 p-3">
          <PlayCircle className="size-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">이전 학습 이어하기</p>
          <p className="mt-1 font-medium">
            지난 세션에서 <span className="text-primary">{topicName}</span>의{" "}
            <span className="text-primary">{context}</span>까지 학습했습니다. 이어서
            학습할까요?
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onResume}
        >
          이어서 학습하기
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          나중에
        </Button>
      </div>
    </div>
  );
}
