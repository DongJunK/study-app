"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, TrendingUp, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicCard } from "@/components/custom/TopicCard";
import { AddTopicDialog } from "@/components/custom/AddTopicDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeCard } from "@/components/custom/ResumeCard";
import { GrowthCard } from "@/components/custom/GrowthCard";
import { StatCard } from "@/components/custom/StatCard";
import { useTopicStore } from "@/stores/topicStore";
import { Skeleton } from "@/components/ui/skeleton";
import type { LastSession } from "@/types/session";
import type { GrowthData } from "@/lib/data/growthManager";
import { toast } from "sonner";
import type { ApiResult } from "@/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const { topics, isLoading, fetchTopics, addTopic, removeTopic } = useTopicStore();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [lastSession, setLastSession] = React.useState<LastSession | null>(null);
  const [resumeDismissed, setResumeDismissed] = React.useState(false);
  const [growthData, setGrowthData] = React.useState<GrowthData[]>([]);
  const [growthLoading, setGrowthLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Fetch last session
  React.useEffect(() => {
    async function fetchLastSession() {
      try {
        const res = await fetch("/api/session");
        const json: ApiResult<LastSession | null> = await res.json();
        if (json.success && json.data) {
          setLastSession(json.data);
        }
      } catch {
        // Silently fail
      }
    }
    fetchLastSession();
  }, []);

  // Fetch growth data
  React.useEffect(() => {
    async function fetchGrowthData() {
      try {
        const res = await fetch("/api/growth");
        const json: ApiResult<GrowthData[]> = await res.json();
        if (json.success) {
          setGrowthData(json.data);
        }
      } catch {
        // Silently fail
      } finally {
        setGrowthLoading(false);
      }
    }
    fetchGrowthData();
  }, []);

  async function handleAddTopic(name: string) {
    try {
      await addTopic(name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "주제 추가에 실패했습니다.");
    }
  }

  function handleLearn(id: string) {
    router.push(`/learn?topic=${id}`);
  }

  function handleTest(id: string) {
    router.push(`/test?topic=${id}`);
  }

  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await removeTopic(deleteTarget);
    setDeleteTarget(null);
  }

  function handleResume(id: string) {
    router.push(`/learn?topic=${id}&resume=true`);
  }

  function handleResumeDismiss() {
    setResumeDismissed(true);
  }

  const totalWeaknesses = topics.reduce((sum, t) => sum + t.weaknessCount, 0);

  const avgProgress = topics.length > 0
    ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
    : 0;

  const totalSessionCount = growthData.reduce(
    (sum, gd) => sum + gd.progressHistory.length,
    0
  );

  // Find topic name for last session
  const lastSessionTopic = lastSession
    ? topics.find((t) => t.id === lastSession.topicId)
    : null;

  const showResumeCard = lastSession && lastSessionTopic && !resumeDismissed;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">대시보드</h1>
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            새 주제 추가
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="size-5" />}
            label="학습 주제"
            value={topics.length}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="size-5" />}
            label="전체 진행률"
            value={`${avgProgress}%`}
            iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <StatCard
            icon={<Target className="size-5" />}
            label="약점 항목"
            value={totalWeaknesses}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          <StatCard
            icon={<Clock className="size-5" />}
            label="학습 세션"
            value={totalSessionCount}
            iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
        </div>

        {/* Resume Card */}
        {showResumeCard && (
          <ResumeCard
            topicName={lastSessionTopic.name}
            context={lastSession.resumeContext}
            onResume={() => handleResume(lastSession.topicId)}
            onDismiss={handleResumeDismiss}
          />
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          /* Empty state - Greeting style */
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">아직 학습 주제가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">첫 번째 주제를 추가해 보세요.</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              새 주제 추가
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...topics].sort((a, b) => { const statusOrder = (s: string) => s === "in-progress" ? 0 : s === "new" ? 1 : 2; const so = statusOrder(a.status) - statusOrder(b.status); if (so !== 0) return so; const po = b.progress - a.progress; if (po !== 0) return po; return a.name.localeCompare(b.name); }).map((topic) => (
              <TopicCard
                key={topic.id}
                id={topic.id}
                name={topic.name}
                progress={topic.progress}
                lastStudyDate={topic.lastStudyDate}
                weaknessCount={topic.weaknessCount}
                status={topic.status}
                level={topic.level}
                onLearn={handleLearn}
                onTest={handleTest}
                onDelete={(id) => setDeleteTarget(id)}
                onClick={(id) => router.push(`/topic/${id}`)}
                hasLastSession={lastSession?.topicId === topic.id}
                lastSessionContext={
                  lastSession?.topicId === topic.id
                    ? lastSession.resumeContext
                    : undefined
                }
                onResume={handleResume}
              />
            ))}
          </div>
        )}

        {/* Growth tracking section */}
        <div className="mt-10">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
            <h2 className="text-lg font-semibold">성장 추적</h2>
          </div>
          {growthLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : growthData.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                학습과 테스트를 진행하면 성장 데이터가 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {growthData.map((gd) => (
                <GrowthCard key={gd.topicId} data={gd} />
              ))}
            </div>
          )}
        </div>

        {/* Weakness summary section */}
        <div className="mt-10">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
            <h2 className="text-lg font-semibold">약점 요약</h2>
          </div>
          {totalWeaknesses === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">아직 약점 항목이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topics.filter(t => t.weaknessCount > 0).map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary/50"
                  onClick={() => router.push(`/weakness?topicId=${t.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/weakness?topicId=${t.id}`); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
                      <Target className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">{t.weaknessCount}건</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTopicDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddTopic}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-[340px] rounded-3xl p-7 text-center">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold">삭제하면 되돌릴 수 없어요</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed">
              이 주제의 진단 결과, 로드맵, 학습 기록이<br />모두 영구적으로 삭제돼요.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={handleDeleteConfirm}
              className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              삭제할게요
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="w-full rounded-xl text-muted-foreground"
            >
              잠깐, 다시 생각해볼게요
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
