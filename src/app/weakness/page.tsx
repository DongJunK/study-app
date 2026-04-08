"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useTopicStore } from "@/stores/topicStore";
import { useWeaknessStore } from "@/stores/weaknessStore";
import { WeaknessTag } from "@/components/custom/WeaknessTag";
import { WeaknessFocusLearning } from "@/components/custom/WeaknessFocusLearning";
import type { Weakness } from "@/types/weakness";
import { ArrowRight, Target, History, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type PagePhase = "list" | "focus-learning";

const STATUS_ORDER = { unknown: 0, confused: 1, understood: 2 } as const;

function sortWeaknesses(weaknesses: Weakness[]): Weakness[] {
  return [...weaknesses].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );
}

function WeaknessContent() {
  const searchParams = useSearchParams();
  const filterTopicId = searchParams.get("topicId");

  const { topics, fetchTopics } = useTopicStore();
  const { weaknesses, isLoading, fetchWeaknesses, updateStatus } =
    useWeaknessStore();

  const [phase, setPhase] = React.useState<PagePhase>("list");
  const [selectedWeakness, setSelectedWeakness] = React.useState<{
    topicId: string;
    topicName: string;
    concept: string;
  } | null>(null);
  const [completedAnimation, setCompletedAnimation] = React.useState<string | null>(null);
  const [topicQueue, setTopicQueue] = React.useState<{ topicId: string; topicName: string; concepts: string[] } | null>(null);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  React.useEffect(() => {
    for (const topic of topics) {
      fetchWeaknesses(topic.id);
    }
  }, [topics, fetchWeaknesses]);

  // Filter topics based on query param
  const displayTopics = filterTopicId
    ? topics.filter((t) => t.id === filterTopicId)
    : topics;

  const filterTopicName = filterTopicId
    ? topics.find((t) => t.id === filterTopicId)?.name
    : null;

  const hasAnyWeakness = displayTopics.some(
    (t) => weaknesses[t.id]?.length > 0
  );

  function handleWeaknessClick(
    topicId: string,
    topicName: string,
    concept: string
  ) {
    setSelectedWeakness({ topicId, topicName, concept });
    setPhase("focus-learning");
  }

  function handleTopicAllLearn(topicId: string, topicName: string) {
    const topicWeaknesses = weaknesses[topicId] || [];
    const concepts = sortWeaknesses(topicWeaknesses).map((w) => w.concept);
    if (concepts.length === 0) return;

    setTopicQueue({ topicId, topicName, concepts: concepts.slice(1) });
    setSelectedWeakness({ topicId, topicName, concept: concepts[0] });
    setPhase("focus-learning");
  }

  async function handleFocusComplete(passed: boolean) {
    if (!selectedWeakness) return;

    const topicWeaknesses = weaknesses[selectedWeakness.topicId] || [];
    const weakness = topicWeaknesses.find(
      (w) => w.concept === selectedWeakness.concept
    );

    if (weakness) {
      const newStatus = passed ? "understood" : "confused";
      await updateStatus(selectedWeakness.topicId, weakness.id, newStatus);

      if (passed) {
        setCompletedAnimation(weakness.id);
        setTimeout(() => setCompletedAnimation(null), 2000);
      }
    }

    // 주제 전체 학습 큐가 있으면 다음 약점으로
    if (topicQueue && topicQueue.concepts.length > 0) {
      const [next, ...rest] = topicQueue.concepts;
      setTopicQueue({ ...topicQueue, concepts: rest });
      setSelectedWeakness({ topicId: topicQueue.topicId, topicName: topicQueue.topicName, concept: next });
      return;
    }

    setTopicQueue(null);
    setPhase("list");
    setSelectedWeakness(null);
  }

  if (phase === "focus-learning" && selectedWeakness) {
    return (
      <main className="flex flex-1 flex-col">
        <WeaknessFocusLearning
          topicId={selectedWeakness.topicId}
          topicName={selectedWeakness.topicName}
          concept={selectedWeakness.concept}
          onComplete={handleFocusComplete}
        />
      </main>
    );
  }

  if (!isLoading && !hasAnyWeakness) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <Target className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              {filterTopicName
                ? `${filterTopicName}에 약점 데이터가 없습니다`
                : "아직 약점 데이터가 없습니다"
              }
            </p>
            <p className="mt-1 text-sm text-muted-foreground">학습과 테스트를 시작하면 자동으로 분류됩니다.</p>
          </div>
          {filterTopicId ? (
            <Link href="/weakness" className={buttonVariants({ size: "sm" })}>
              전체 약점 보기
            </Link>
          ) : (
            <Link href="/" className={buttonVariants({ size: "sm" })}>
              대시보드로 이동
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {filterTopicName ? `${filterTopicName} 약점` : "약점 추적"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            약점을 클릭하면 집중 학습을 시작합니다
          </p>
          {filterTopicId && (
            <Link href="/weakness" className="text-sm text-primary hover:underline mt-1 inline-block">
              전체 주제 약점 보기 →
            </Link>
          )}
        </div>

        {/* History card - only show when viewing all */}
        {!filterTopicId && (
          <Link
            href="/weakness/history"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                <History className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">역대 약점 조회</p>
                <p className="text-xs text-muted-foreground">해결한 약점 포함 전체 이력 확인</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        )}


        {/* Weakness list by topic */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTopics.map((topic) => {
              const topicWeaknesses = weaknesses[topic.id];
              if (!topicWeaknesses || topicWeaknesses.length === 0) return null;

              const sorted = sortWeaknesses(topicWeaknesses);
              const unknownCount = topicWeaknesses.filter((w) => w.status === "unknown").length;
              const confusedCount = topicWeaknesses.filter((w) => w.status === "confused").length;
              const understoodCount = topicWeaknesses.filter((w) => w.status === "understood").length;

              return (
                <div
                  key={topic.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{topic.name}</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-7"
                        onClick={() => handleTopicAllLearn(topic.id, topic.name)}
                      >
                        <BookOpen className="size-3.5" />
                        전체 학습
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {unknownCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-red-500" />
                          모름 {unknownCount}
                        </span>
                      )}
                      {confusedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-amber-500" />
                          헷갈림 {confusedCount}
                        </span>
                      )}
                      {understoodCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          이해함 {understoodCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sorted.map((w) => (
                      <div
                        key={w.id}
                        className={`transition-all duration-500 ${
                          completedAnimation === w.id
                            ? "scale-110 ring-2 ring-emerald-500"
                            : ""
                        }`}
                      >
                        <WeaknessTag
                          concept={w.concept}
                          status={w.status}
                          onClick={() =>
                            handleWeaknessClick(topic.id, topic.name, w.concept)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function WeaknessPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            불러오는 중...
          </div>
        </main>
      }
    >
      <WeaknessContent />
    </React.Suspense>
  );
}
