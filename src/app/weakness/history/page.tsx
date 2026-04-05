"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTopicStore } from "@/stores/topicStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, ClipboardCheck, CheckCircle, AlertTriangle, History } from "lucide-react";
import type { Weakness } from "@/types/weakness";
import type { ApiResult } from "@/types/api";

export default function WeaknessHistoryPage() {
  const router = useRouter();
  const { topics, fetchTopics } = useTopicStore();
  const [allWeaknesses, setAllWeaknesses] = React.useState<Record<string, Weakness[]>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  React.useEffect(() => {
    if (topics.length === 0) return;

    async function fetchAll() {
      const results: Record<string, Weakness[]> = {};
      await Promise.all(
        topics.map(async (t) => {
          try {
            const res = await fetch(`/api/topics/${t.id}/weakness`);
            const json: ApiResult<Weakness[]> = await res.json();
            if (json.success) results[t.id] = json.data;
          } catch {
            // ignore
          }
        })
      );
      setAllWeaknesses(results);
      setLoading(false);
    }
    fetchAll();
  }, [topics]);

  function handleFocusLearn(topicId: string, concept: string) {
    router.push(`/weakness?action=learn&topicId=${topicId}&concept=${encodeURIComponent(concept)}`);
  }

  function handleQuiz(topicId: string, concept: string) {
    router.push(`/weakness?action=quiz&topicId=${topicId}&concept=${encodeURIComponent(concept)}`);
  }

  if (loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </main>
    );
  }

  const totalWeaknesses = Object.values(allWeaknesses).flat();
  const activeCount = totalWeaknesses.filter(w => w.status !== "understood").length;
  const resolvedCount = totalWeaknesses.filter(w => w.status === "understood").length;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2" onClick={() => router.push("/weakness")}>
            <ArrowLeft className="size-4" />
            약점 추적
          </Button>
          <h1 className="text-2xl font-semibold">역대 약점</h1>
          <p className="text-sm text-muted-foreground mt-1">
            모든 약점 이력을 주제별로 확인합니다
          </p>
          <div className="flex gap-3 mt-3">
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="size-3" />
              활성 {activeCount}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3" />
              해결 {resolvedCount}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              전체 {totalWeaknesses.length}
            </Badge>
          </div>
        </div>

        {/* Topic sections */}
        {totalWeaknesses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">아직 약점 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {topics.map((topic) => {
              const weaknesses = allWeaknesses[topic.id];
              if (!weaknesses || weaknesses.length === 0) return null;

              // Sort: active first (by detectedCount desc), then resolved
              const sorted = [...weaknesses].sort((a, b) => {
                if (a.status === "understood" && b.status !== "understood") return 1;
                if (a.status !== "understood" && b.status === "understood") return -1;
                return (b.detectedCount || 1) - (a.detectedCount || 1);
              });

              return (
                <section key={topic.id} className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border">{topic.name}</h2>
                  <div className="space-y-2">
                    {sorted.map((w) => {
                      const isResolved = w.status === "understood";
                      const count = w.detectedCount || 1;

                      return (
                        <div
                          key={w.id}
                          className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                            isResolved
                              ? "border-border/50 bg-muted/30"
                              : "border-border bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Status indicator */}
                            {isResolved ? (
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                                <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : (
                              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                w.status === "unknown"
                                  ? "bg-red-50 dark:bg-red-500/10"
                                  : "bg-amber-50 dark:bg-amber-500/10"
                              }`}>
                                <AlertTriangle className={`size-4 ${
                                  w.status === "unknown"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${isResolved ? "text-muted-foreground line-through" : ""}`}>
                                {w.concept}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isResolved && (
                                  <Badge variant="secondary" className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                                    해결됨
                                  </Badge>
                                )}
                                {count > 1 && (
                                  <span className="text-xs text-red-500 font-medium">
                                    {count}번째 약점
                                  </span>
                                )}
                                {count === 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    1번째 약점
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  · {new Date(w.lastUpdated).toLocaleDateString("ko-KR")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 ml-3 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleFocusLearn(topic.id, w.concept)}
                            >
                              <BookOpen className="size-3" />
                              학습
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleQuiz(topic.id, w.concept)}
                            >
                              <ClipboardCheck className="size-3" />
                              퀴즈
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
