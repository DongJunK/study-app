"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, TrendingUp, Target, FileCheck,
  RotateCcw, Play, ClipboardCheck, Calendar, Award, Clock, MessageSquare, RefreshCw,
  CheckCircle2, XCircle, X, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/custom/StatCard";
import { WeaknessTag } from "@/components/custom/WeaknessTag";
import { SimpleBarChart } from "@/components/custom/SimpleBarChart";
import type { Topic, Roadmap } from "@/types/topic";
import type { TestResult, TestAnswer } from "@/types/test";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Weakness } from "@/types/weakness";
import type { ApiResult } from "@/types/api";
import type { DiagnosisData } from "@/lib/data/roadmapManager";
import type { GrowthData } from "@/lib/data/growthManager";
import { useSettingsStore } from "@/stores/settingsStore";

interface SessionInfo {
  id: string;
  filename: string;
  date: string;
  size: number;
  mode?: string;
  roadmapItemId?: string | null;
  messageCount?: number;
  startedAt?: string;
  elapsedSeconds?: number;
  conceptTitle?: string;
  completed?: boolean;
}

interface TopicDetailData {
  topic: Topic;
  diagnosis: DiagnosisData | null;
  roadmap: Roadmap | null;
  testResults: TestResult[];
  recentSessions: SessionInfo[];
  weaknesses: Weakness[];
  growth: GrowthData | null;
}

const mdComponents = {
  p: ({ children, ...props }: React.ComponentProps<"p">) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props}>{children}</p>,
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => <ul className="text-sm list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => <ol className="text-sm list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
  li: ({ children, ...props }: React.ComponentProps<"li">) => <li className="text-sm" {...props}>{children}</li>,
  strong: ({ children, ...props }: React.ComponentProps<"strong">) => <strong className="font-semibold" {...props}>{children}</strong>,
  code: ({ children, ...props }: React.ComponentProps<"code">) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>,
  pre: ({ children, ...props }: React.ComponentProps<"pre">) => <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto mb-2" {...props}>{children}</pre>,
};

function AnswerDetailCard({ answer, index, isMC }: { answer: TestAnswer; index: number; isMC?: boolean }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
          <span className="text-sm font-medium line-clamp-1">{answer.question || `질문 ${index + 1}`}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-sm font-semibold">{answer.score}/{answer.maxScore}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${answer.passed ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
            {isMC ? (answer.passed ? "정답" : "오답") : (answer.passed ? "통과" : "미달")}
          </span>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {answer.question && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">질문</p>
              <div className="text-sm text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.question}</ReactMarkdown>
              </div>
            </div>
          )}
          {answer.userAnswer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">내 답변</p>
              <div className={`rounded-lg border px-4 py-3 ${answer.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <div className="text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.userAnswer}</ReactMarkdown></div>
              </div>
            </div>
          )}
          {answer.modelAnswer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">모범 답변</p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.modelAnswer}</ReactMarkdown></div>
              </div>
            </div>
          )}
          {answer.feedback && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">피드백</p>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-sm text-muted-foreground"><ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.feedback}</ReactMarkdown></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const [data, setData] = React.useState<TopicDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedTestResult, setSelectedTestResult] = React.useState<TestResult | null>(null);
  const [showAllSessions, setShowAllSessions] = React.useState(false);
  const [showAllTests, setShowAllTests] = React.useState(false);
  const { roadmapLockEnabled } = useSettingsStore();

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
              {topic.status === "new" ? (
                <Button size="sm" onClick={() => router.push(`/learn?topic=${topicId}`)}>
                  <Play className="size-3.5 mr-1.5" />
                  수준 진단하기
                </Button>
              ) : (
                <>
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
                </>
              )}
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
              {(() => {
                const completedSessions = recentSessions.filter(s => s.size > 0 && (s.messageCount ?? 0) > 0 && s.completed !== false);
                if (completedSessions.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-4">아직 학습 기록이 없습니다</p>;
                }

                const modeLabel: Record<string, string> = {
                  basic: "기본 학습",
                  deep: "심화 학습",
                  example: "예제 학습",
                  quiz: "퀴즈",
                  diagnosis: "수준 진단",
                };

                function formatElapsed(sec?: number) {
                  if (!sec || sec <= 0) return null;
                  const m = Math.floor(sec / 60);
                  if (m < 1) return "1분 미만";
                  if (m >= 60) return `${Math.floor(m / 60)}시간 ${m % 60}분`;
                  return `${m}분`;
                }

                const displaySessions = showAllSessions ? completedSessions : completedSessions.slice(0, 5);

                return (
                  <div className="space-y-2">
                    {displaySessions.map((s) => (
                      <div key={s.id} className="rounded-lg border border-border bg-background px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {new Date(s.date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {s.mode && (
                              <Badge variant="secondary" className="text-xs">
                                {modeLabel[s.mode] ?? s.mode}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {formatElapsed(s.elapsedSeconds) && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatElapsed(s.elapsedSeconds)}
                              </span>
                            )}
                            {(s.messageCount ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="size-3" />
                                {s.messageCount}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs gap-1"
                              onClick={() => router.push(`/learn?topic=${topicId}&reviewSession=${s.id}`)}
                            >
                              <RefreshCw className="size-3" />
                              복습
                            </Button>
                          </div>
                        </div>
                        {s.conceptTitle && (
                          <p className="text-xs text-muted-foreground pl-5.5">
                            {s.conceptTitle}
                          </p>
                        )}
                      </div>
                    ))}
                    {completedSessions.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setShowAllSessions(!showAllSessions)}
                      >
                        {showAllSessions ? "접기" : `더보기 (${completedSessions.length - 5}개 더)`}
                      </Button>
                    )}
                  </div>
                );
              })()}
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
                  {(showAllTests ? testResults : testResults.slice(0, 5)).map((t) => {
                    const pct = Math.round((t.totalScore / t.maxTotalScore) * 100);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2"
                        onClick={() => setSelectedTestResult(t)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setSelectedTestResult(t); }}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">{new Date(t.createdAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          <Badge variant="secondary" className="text-xs">{testTypeLabel[t.type] ?? t.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${scoreColor(pct)}`}>{pct}점</span>
                          <Badge variant={t.passed ? "default" : "outline"} className="text-xs">
                            {t.passed ? "합격" : "불합격"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/learn?topic=${topicId}&reviewTest=${t.id}`);
                            }}
                          >
                            <RefreshCw className="size-3" />
                            복습
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {testResults.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground mt-2"
                      onClick={() => setShowAllTests(!showAllTests)}
                    >
                      {showAllTests ? "접기" : `더보기 (${testResults.length - 5}개 더)`}
                    </Button>
                  )}
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
                    const displayStatus = (!roadmapLockEnabled && item.status === "locked") ? "available" : item.status;
                    const statusIcon = displayStatus === "completed" ? "✓" : displayStatus === "in-progress" ? "●" : "○";
                    const statusClass = displayStatus === "completed" ? "text-emerald-500" : displayStatus === "in-progress" ? "text-amber-500" : displayStatus === "available" ? "text-blue-500" : "text-muted-foreground";
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-1.5">
                        <span className={`text-sm ${statusClass}`}>{statusIcon}</span>
                        <span className="text-sm">{item.title}</span>
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

      {/* Test detail modal */}
      {selectedTestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedTestResult(null)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
              <div>
                <h3 className="text-base font-semibold">테스트 상세</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {testTypeLabel[selectedTestResult.type] ?? selectedTestResult.type} &middot; {new Date(selectedTestResult.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTestResult(null)} className="size-8 p-0">
                <X className="size-4" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              {(() => {
                const pct = selectedTestResult.maxTotalScore > 0 ? Math.round((selectedTestResult.totalScore / selectedTestResult.maxTotalScore) * 100) : 0;
                return (
                  <div className={`flex items-center justify-center gap-4 rounded-xl border p-5 ${selectedTestResult.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    {selectedTestResult.passed ? <CheckCircle2 className="size-8 text-emerald-500" /> : <XCircle className="size-8 text-red-500" />}
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${selectedTestResult.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {selectedTestResult.totalScore} / {selectedTestResult.maxTotalScore} ({pct}%)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTestResult.passed ? "합격" : "불합격"} (합격선: 70%)</p>
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-3">
                {selectedTestResult.answers.map((a, idx) => (
                  <AnswerDetailCard key={idx} answer={a} index={idx} isMC={selectedTestResult.type === "multiple-choice"} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
