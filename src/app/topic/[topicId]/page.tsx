"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, TrendingUp, Target, FileCheck,
  RotateCcw, Play, ClipboardCheck, Calendar, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/custom/StatCard";
import { WeaknessTag } from "@/components/custom/WeaknessTag";
import { SimpleBarChart } from "@/components/custom/SimpleBarChart";
import type { Topic, Roadmap } from "@/types/topic";
import type { TestResult } from "@/types/test";
import type { Weakness } from "@/types/weakness";
import type { ApiResult } from "@/types/api";
import type { DiagnosisData } from "@/lib/data/roadmapManager";
import type { GrowthData } from "@/lib/data/growthManager";

interface TopicDetailData {
  topic: Topic;
  diagnosis: DiagnosisData | null;
  roadmap: Roadmap | null;
  testResults: TestResult[];
  recentSessions: Array<{ id: string; filename: string; date: string; size: number }>;
  weaknesses: Weakness[];
  growth: GrowthData | null;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const [data, setData] = React.useState<TopicDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/topics/${topicId}/detail`);
        const json: ApiResult<TopicDetailData> = await res.json();
        if (json.success) setData(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [topicId]);

  if (loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">주제를 찾을 수 없습니다.</p>
      </main>
    );
  }

  const { topic, diagnosis, roadmap, testResults, recentSessions, weaknesses, growth } = data;

  const latestScore = testResults.length > 0
    ? Math.round((testResults[0].totalScore / testResults[0].maxTotalScore) * 100)
    : null;
  const bestScore = testResults.length > 0
    ? Math.round(Math.max(...testResults.map(t => (t.totalScore / t.maxTotalScore) * 100)))
    : null;
  const sessionCount = growth?.progressHistory.length ?? recentSessions.length;

  const levelLabel: Record<string, string> = { beginner: "초급", intermediate: "중급", advanced: "고급" };
  const levelColor: Record<string, string> = { beginner: "text-blue-500", intermediate: "text-amber-500", advanced: "text-emerald-500" };
  const statusLabel: Record<string, string> = { new: "신규", "in-progress": "진행중", completed: "완료" };

  const progressChartData = (growth?.progressHistory ?? []).map(p => ({
    label: p.date.slice(5, 10),
    value: p.progress,
    maxValue: 100,
  }));

  const testScoreData = testResults.slice(0, 10).reverse().map(t => ({
    label: t.createdAt.slice(5, 10),
    value: Math.round((t.totalScore / t.maxTotalScore) * 100),
    maxValue: 100,
  }));

  function scoreColor(pct: number) {
    if (pct >= 70) return "text-emerald-500";
    if (pct >= 50) return "text-amber-500";
    return "text-red-500";
  }

  const testTypeLabel: Record<string, string> = {
    "deep-learning": "깊은 학습",
    "multiple-choice": "객관식",
    "short-answer": "주관식",
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2" onClick={() => router.push("/")}>
            <ArrowLeft className="size-4" />
            대시보드
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{topic.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{statusLabel[topic.status] ?? topic.status}</Badge>
                {diagnosis && (
                  <Badge variant="secondary" className={levelColor[diagnosis.level]}>
                    {levelLabel[diagnosis.level] ?? diagnosis.level}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push(`/learn?topic=${topicId}`)}>
                <Play className="size-3.5 mr-1.5" />
                학습하기
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push(`/test?topic=${topicId}`)}>
                <ClipboardCheck className="size-3.5 mr-1.5" />
                테스트하기
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push(`/learn?topic=${topicId}&rediagnose=true`)}>
                <RotateCcw className="size-3.5 mr-1.5" />
                수준 재진단
              </Button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<TrendingUp className="size-5" />}
            label="진행률"
            value={`${topic.progress}%`}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />
          <StatCard
            icon={<BookOpen className="size-5" />}
            label="학습 세션"
            value={`${sessionCount}회`}
            iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <StatCard
            icon={<Award className="size-5" />}
            label="테스트 점수"
            value={latestScore !== null ? `${latestScore}점` : "-"}
            trend={bestScore !== null && bestScore !== latestScore ? { value: `최고 ${bestScore}점`, positive: true } : undefined}
            iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
          <StatCard
            icon={<Target className="size-5" />}
            label="약점 항목"
            value={`${weaknesses.filter(w => w.status !== "understood").length}개`}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Learning History */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />
                학습 이력
              </h3>
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">아직 학습 기록이 없습니다</p>
              ) : (
                <div className="space-y-1">
                  {recentSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="text-sm">{new Date(s.date).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(s.size / 1024)}KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Test History */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border flex items-center gap-2">
                <FileCheck className="size-4 text-muted-foreground" />
                테스트 이력
              </h3>
              {testResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">아직 테스트 기록이 없습니다</p>
              ) : (
                <div className="space-y-1">
                  {testResults.slice(0, 10).map((t) => {
                    const pct = Math.round((t.totalScore / t.maxTotalScore) * 100);
                    return (
                      <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">{new Date(t.createdAt).toLocaleDateString("ko-KR")}</span>
                          <Badge variant="secondary" className="text-xs">{testTypeLabel[t.type] ?? t.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${scoreColor(pct)}`}>{pct}점</span>
                          <Badge variant={t.passed ? "default" : "outline"} className="text-xs">
                            {t.passed ? "합격" : "불합격"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Level Info */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border">수준 정보</h3>
              {diagnosis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">현재 수준:</span>
                    <span className={`font-semibold ${levelColor[diagnosis.level]}`}>
                      {levelLabel[diagnosis.level]}
                    </span>
                  </div>
                  {diagnosis.summary && (
                    <p className="text-sm text-muted-foreground">{diagnosis.summary}</p>
                  )}
                  <div>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">강점</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {diagnosis.strengths.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">약점</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {weaknesses.length > 0 ? (
                        weaknesses.slice(0, 8).map((w) => (
                          <WeaknessTag key={w.id} concept={w.concept} status={w.status} />
                        ))
                      ) : (
                        diagnosis.weaknesses.map((w, i) => (
                          <Badge key={i} variant="secondary" className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">{w}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">수준 진단을 먼저 진행해 주세요</p>
              )}
            </section>

            {/* Progress Chart */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border">진행률 변화</h3>
              <SimpleBarChart data={progressChartData} emptyMessage="학습을 진행하면 진행률 변화가 표시됩니다" />
            </section>

            {/* Test Score Chart */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border">테스트 점수 추이</h3>
              <SimpleBarChart data={testScoreData} emptyMessage="테스트를 진행하면 점수 추이가 표시됩니다" />
            </section>

            {/* Roadmap Compact */}
            {roadmap && roadmap.items.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h3 className="text-lg font-semibold">학습 로드맵</h3>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/learn?topic=${topicId}`)}>
                    전체 보기
                  </Button>
                </div>
                <div className="space-y-2">
                  {roadmap.items.slice(0, 5).map((item) => {
                    const statusIcon = item.status === "completed" ? "✓" : item.status === "in-progress" ? "●" : item.status === "available" ? "○" : "🔒";
                    const statusClass = item.status === "completed" ? "text-emerald-500" : item.status === "in-progress" ? "text-amber-500" : "text-muted-foreground";
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-1.5">
                        <span className={`text-sm ${statusClass}`}>{statusIcon}</span>
                        <span className={`text-sm ${item.status === "locked" ? "text-muted-foreground" : ""}`}>{item.title}</span>
                      </div>
                    );
                  })}
                  {roadmap.items.length > 5 && (
                    <p className="text-xs text-muted-foreground">외 {roadmap.items.length - 5}개 항목</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
