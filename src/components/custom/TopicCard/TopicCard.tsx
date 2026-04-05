"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Calendar, AlertTriangle } from "lucide-react";

interface TopicCardProps {
  id: string;
  name: string;
  progress: number;
  lastStudyDate: string | null;
  weaknessCount: number;
  status: "new" | "in-progress" | "completed";
  onLearn: (id: string) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (id: string) => void;
  hasLastSession?: boolean;
  lastSessionContext?: string;
  onResume?: (id: string) => void;
}

const statusConfig = {
  new: { label: "신규", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-0" },
  "in-progress": { label: "진행중", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0" },
  completed: { label: "완료", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0" },
};

export function TopicCard({
  id,
  name,
  progress,
  lastStudyDate,
  weaknessCount,
  status,
  onLearn,
  onTest,
  onDelete,
  onClick,
  hasLastSession,
  lastSessionContext,
  onResume,
}: TopicCardProps) {
  const statusInfo = statusConfig[status];

  function handleCardClick() {
    if (onClick) onClick(id);
  }

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 transition-colors hover:border-primary/50 cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") handleCardClick(); }}
    >
      {/* Top: name + status + delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold leading-tight">{name}</h3>
          <Badge variant="secondary" className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { stop(e); onDelete(id); }}
          aria-label="주제 삭제"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{progress}%</span>
      </div>

      {/* Meta info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span>{lastStudyDate ? lastStudyDate : "아직 학습하지 않음"}</span>
        </div>
        {weaknessCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="size-3" />
            <span>약점 {weaknessCount}개</span>
          </div>
        )}
      </div>

      {/* Resume context */}
      {hasLastSession && lastSessionContext && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          지난 세션: {lastSessionContext}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {status === "new" ? (
          <Button size="sm" className="flex-1" onClick={(e) => { stop(e); onLearn(id); }}>
            수준 진단하기
          </Button>
        ) : hasLastSession && onResume ? (
          <>
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => { stop(e); onResume(id); }}
            >
              이어서 학습하기
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" className="flex-1" onClick={(e) => { stop(e); onLearn(id); }}>
              학습하기
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { stop(e); onTest(id); }}>
              테스트하기
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
