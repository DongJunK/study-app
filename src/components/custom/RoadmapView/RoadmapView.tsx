"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Check, Lock, Circle, Loader2 } from "lucide-react";
import type { Roadmap } from "@/types/topic";

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
  },
  available: {
    label: "학습 가능",
    icon: Circle,
    color: "bg-blue-500/10 text-blue-500",
    dot: "bg-blue-500",
  },
  "in-progress": {
    label: "진행중",
    icon: Loader2,
    color: "bg-amber-500/10 text-amber-500",
    dot: "bg-amber-500",
  },
  completed: {
    label: "완료",
    icon: Check,
    color: "bg-emerald-500/10 text-emerald-500",
    dot: "bg-emerald-500",
  },
};

export function RoadmapView({
  topicId,
  roadmap,
  onAddItem,
  onStartLearning,
}: RoadmapViewProps) {
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

  const sortedItems = [...roadmap.items].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h2 className="mb-6 text-xl font-bold">학습 로드맵</h2>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-1">
          {sortedItems.map((item, index) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            const isClickable =
              item.status === "available" || item.status === "in-progress";

            return (
              <div
                key={item.id}
                className={`group relative flex items-start gap-4 rounded-xl p-3 transition-colors ${
                  isClickable
                    ? "cursor-pointer hover:bg-muted/50"
                    : ""
                } ${item.status === "locked" ? "opacity-60" : ""}`}
                onClick={() => {
                  if (isClickable && onStartLearning) {
                    onStartLearning(item.id);
                  }
                }}
              >
                {/* Status dot */}
                <div
                  className={`relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background ${config.dot}`}
                >
                  <StatusIcon
                    className={`size-4 ${
                      item.status === "completed"
                        ? "text-white"
                        : item.status === "locked"
                          ? "text-muted-foreground/60"
                          : "text-white"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.order}
                    </span>
                    <h3
                      className={`text-sm font-medium ${
                        item.status === "locked"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.isCustom && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        사용자 추가
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <Badge className={`text-[10px] ${config.color}`}>
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {/* Action hint for clickable items */}
                {isClickable && (
                  <span className="hidden text-xs text-muted-foreground group-hover:block">
                    학습 시작
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add item section */}
      <div className="mt-6 pl-12">
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
            <Button size="sm" onClick={handleAddItem} disabled={!newItemTitle.trim()}>
              추가
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddInput(false);
                setNewItemTitle("");
              }}
            >
              취소
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowAddInput(true)}
          >
            <Plus className="size-4" />
            항목 추가
          </Button>
        )}
      </div>
    </div>
  );
}
