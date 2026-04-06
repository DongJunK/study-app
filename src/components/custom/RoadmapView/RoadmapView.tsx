"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Check, Lock, Circle, Loader2, Play } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Roadmap, RoadmapItem } from "@/types/topic";

interface RoadmapViewProps {
  topicId: string;
  roadmap: Roadmap;
  onAddItem?: (title: string) => void;
  onStartLearning?: (itemId: string) => void;
}

const statusConfig = {
  locked: {
    label: "잠김",
    icon: Lock,
    color: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
    cardBorder: "border-border/50 opacity-60",
  },
  available: {
    label: "학습 가능",
    icon: Circle,
    color: "bg-blue-500/10 text-blue-500",
    dot: "bg-blue-500",
    cardBorder: "border-blue-500/30 hover:border-blue-500/60",
  },
  "in-progress": {
    label: "진행중",
    icon: Loader2,
    color: "bg-amber-500/10 text-amber-500",
    dot: "bg-amber-500",
    cardBorder: "border-amber-500/30 hover:border-amber-500/60",
  },
  completed: {
    label: "완료",
    icon: Check,
    color: "bg-emerald-500/10 text-emerald-500",
    dot: "bg-emerald-500",
    cardBorder: "border-emerald-500/30 hover:border-emerald-500/60",
  },
};

export function RoadmapView({
  topicId,
  roadmap,
  onAddItem,
  onStartLearning,
}: RoadmapViewProps) {
  const { roadmapViewMode, roadmapLockEnabled } = useSettingsStore();
  const [showAddInput, setShowAddInput] = React.useState(false);
  const [newItemTitle, setNewItemTitle] = React.useState("");
  const inputRef = React.useCallback((node: HTMLInputElement | null) => {
    if (node) node.focus();
  }, []);

  function handleAddItem() {
    const trimmed = newItemTitle.trim();
    if (!trimmed || !onAddItem) return;
    onAddItem(trimmed);
    setNewItemTitle("");
    setShowAddInput(false);
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === "Escape") {
      setShowAddInput(false);
      setNewItemTitle("");
    }
  }

  function isClickable(item: RoadmapItem): boolean {
    if (!roadmapLockEnabled) {
      return true; // 잠김 비활성화: 모든 항목 학습 가능
    }
    return item.status === "available" || item.status === "in-progress" || item.status === "completed";
  }

  function getDisplayStatus(item: RoadmapItem): RoadmapItem["status"] {
    if (!roadmapLockEnabled && item.status === "locked") {
      return "available"; // 잠김 비활성화 시 locked → available로 표시
    }
    return item.status;
  }

  const sortedItems = [...roadmap.items].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h2 className="mb-6 text-xl font-bold">학습 로드맵</h2>

      {roadmapViewMode === "card" ? (
        /* Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedItems.map((item) => {
            const displayStatus = getDisplayStatus(item);
            const config = statusConfig[displayStatus];
            const StatusIcon = config.icon;
            const clickable = isClickable(item);

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-card p-4 transition-all ${config.cardBorder} ${
                  clickable ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (clickable && onStartLearning) onStartLearning(item.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${config.dot}`}>
                      <StatusIcon className="size-3.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{item.order}</span>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${config.color}`}>{config.label}</Badge>
                </div>
                <h3 className={`mt-3 text-sm font-medium leading-snug ${
                  displayStatus === "locked" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {item.title}
                </h3>
                {item.isCustom && (
                  <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">사용자 추가</Badge>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline View */
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-1">
            {sortedItems.map((item) => {
              const displayStatus = getDisplayStatus(item);
              const config = statusConfig[displayStatus];
              const StatusIcon = config.icon;
              const clickable = isClickable(item);

              return (
                <div
                  key={item.id}
                  className={`group relative flex items-start gap-4 rounded-xl p-3 transition-colors ${
                    clickable ? "cursor-pointer hover:bg-muted" : ""
                  } ${displayStatus === "locked" ? "opacity-60" : ""}`}
                  onClick={() => {
                    if (clickable && onStartLearning) onStartLearning(item.id);
                  }}
                >
                  <div className={`relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background ${config.dot}`}>
                    <StatusIcon className={`size-4 ${
                      displayStatus === "locked" ? "text-muted-foreground/60" : "text-white"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{item.order}</span>
                      <h3 className={`text-sm font-medium ${
                        displayStatus === "locked" ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {item.title}
                      </h3>
                      {item.isCustom && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">사용자 추가</Badge>
                      )}
                    </div>
                    <div className="mt-1">
                      <Badge className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add item section */}
      <div className={`mt-6 ${roadmapViewMode === "timeline" ? "pl-12" : ""}`}>
        {showAddInput ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="새 학습 항목 제목..."
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddItem} disabled={!newItemTitle.trim()}>추가</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddInput(false); setNewItemTitle(""); }}>취소</Button>
          </div>
        ) : (
          <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setShowAddInput(true)}>
            <Plus className="size-4" />
            항목 추가
          </Button>
        )}
      </div>
    </div>
  );
}
