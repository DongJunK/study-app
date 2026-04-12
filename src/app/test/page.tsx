"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { TestSetup } from "@/components/custom/TestSetup";
import { TestSession } from "@/components/custom/TestSession";
import { MCQuizSession } from "@/components/custom/MCQuizSession";
import { AnswerComparison } from "@/components/custom/AnswerComparison";
import { FollowUpChat } from "@/components/custom/FollowUpChat";
import { ScoreIndicator } from "@/components/custom/ScoreIndicator";
import { useTestStore } from "@/stores/testStore";
import type { Topic } from "@/types/topic";
import type { TestType, TestAnswer, TestResult } from "@/types/test";
import { ArrowLeft, CheckCircle2, XCircle, FileCheck, ClipboardCheck, Play, Shuffle, Clock, ChevronRight, X, ChevronDown, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResult } from "@/types/api";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const mdComponents = {
  p: ({ children, ...props }: React.ComponentProps<"p">) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props}>{children}</p>,
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => <ul className="text-sm list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => <ol className="text-sm list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
  li: ({ children, ...props }: React.ComponentProps<"li">) => <li className="text-sm" {...props}>{children}</li>,
  strong: ({ children, ...props }: React.ComponentProps<"strong">) => <strong className="font-semibold" {...props}>{children}</strong>,
  code: ({ children, ...props }: React.ComponentProps<"code">) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>,
  pre: ({ children, ...props }: React.ComponentProps<"pre">) => <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto mb-2" {...props}>{children}</pre>,
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => <h3 className="text-sm font-semibold mt-3 mb-1" {...props}>{children}</h3>,
  h4: ({ children, ...props }: React.ComponentProps<"h4">) => <h4 className="text-sm font-medium mt-2 mb-1" {...props}>{children}</h4>,
  blockquote: ({ children, ...props }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic mb-2" {...props}>{children}</blockquote>,
};

function AnswerDetailCard({ answer, index, isMC }: { answer: TestAnswer; index: number; isMC?: boolean }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {index + 1}
          </span>
          <span className="text-sm font-medium">
            문제 {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-sm font-semibold">{answer.score}/{answer.maxScore}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              answer.passed
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {isMC ? (answer.passed ? "정답" : "오답") : (answer.passed ? "통과" : "미달")}
          </span>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Question */}
          {answer.question && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">질문</p>
              <div className="text-sm text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.question}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* User answer */}
          {answer.userAnswer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">내 답변</p>
              <div className={`rounded-lg border px-4 py-3 ${answer.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <div className="text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.userAnswer}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Model answer */}
          {answer.modelAnswer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">모범 답변</p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.modelAnswer}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {answer.feedback && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">피드백</p>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer.feedback}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestPageContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");

  const {
    currentTest,
    phase,
    startTest,
    setPhase,
    endTest,
    reset,
  } = useTestStore();

  const [topic, setTopic] = React.useState<Topic | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completedAnswers, setCompletedAnswers] = React.useState<TestAnswer[]>([]);
  const [comparison, setComparison] = React.useState<{
    results: {
      questionIndex: number;
      question: string;
      modelAnswer: string;
      gaps: string[];
      feedback: string;
    }[];
  } | null>(null);
  const [testResultId, setTestResultId] = React.useState<string>("");
  const [comparingLoading, setComparingLoading] = React.useState(false);
  const [isStrategic, setIsStrategic] = React.useState(false);
  const [allTopicNames, setAllTopicNames] = React.useState<string[]>([]);

  // Fetch topic(s)
  React.useEffect(() => {
    if (!topicId) {
      setLoading(false);
      return;
    }

    if (topicId === "all") {
      // Mixed test: fetch all topics and create a virtual combined topic
      fetch("/api/topics")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setAllTopicNames(data.data.map((t: Topic) => t.name));
            setTopic({
              id: "all",
              name: "전체 주제 테스트",
              progress: 0,
              lastStudyDate: null,
              createdAt: new Date().toISOString(),
              weaknessCount: 0,
              status: "in-progress",
              level: null,
            });
          }
        })
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/topics/${topicId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setTopic(data.data);
        })
        .finally(() => setLoading(false));
    }
  }, [topicId]);

  // Reset on unmount
  React.useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          불러오는 중...
        </div>
      </main>
    );
  }

  if (!topicId || !topic) {
    return <TestTopicSelector />;
  }

  function handleStartTest(type: TestType, strategic?: boolean) {
    setIsStrategic(strategic || false);
    startTest(topic!.id, type, 0);
  }

  function handleTestComplete(answers: TestAnswer[]) {
    setCompletedAnswers(answers);
    endTest();
    saveTestResult(answers);
  }

  async function saveTestResult(answers: TestAnswer[]) {
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    const maxTotalScore = answers.reduce((sum, a) => sum + a.maxScore, 0);
    const id = `test-${Date.now()}`;
    setTestResultId(id);

    const result: TestResult = {
      id,
      topicId: topic!.id,
      type: currentTest!.type,
      duration: currentTest!.duration,
      answers,
      totalScore,
      maxTotalScore,
      passThreshold: 0.7,
      passed: totalScore / maxTotalScore >= 0.7,
      createdAt: new Date().toISOString(),
      followUpQnA: [],
    };

    try {
      const res = await fetch("/api/test/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic!.id, result }),
      });
      const json = await res.json();
      if (json.success && json.data?.levelChange?.changed) {
        const levelLabel: Record<string, string> = {
          beginner: "초급",
          intermediate: "중급",
          advanced: "고급",
        };
        const { oldLevel, newLevel } = json.data.levelChange;
        const isPromotion = (oldLevel === "beginner" && newLevel !== "beginner") ||
          (oldLevel === "intermediate" && newLevel === "advanced");
        toast(
          isPromotion
            ? `축하합니다! 수준이 ${levelLabel[oldLevel]} → ${levelLabel[newLevel]}로 승급했습니다!`
            : `수준이 ${levelLabel[oldLevel]} → ${levelLabel[newLevel]}로 변경되었습니다.`,
          { duration: 5000 }
        );
      }
    } catch {
      // silent fail for save
    }
  }

  async function handleRequestComparison() {
    if (completedAnswers.length === 0) return;
    setComparingLoading(true);

    try {
      const res = await fetch("/api/test/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: completedAnswers.map((a) => ({
            question: a.question || "",
            userAnswer: a.userAnswer || "",
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComparison(data.data);
        setPhase("comparison");
      }
    } catch {
      // silent fail
    } finally {
      setComparingLoading(false);
    }
  }

  function handleFollowUp(_question: string) {
    // Transition to followup phase
    setPhase("followup");
  }

  function handleFollowUpComplete() {
    setPhase("results");
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-1 size-4" />
          대시보드로
        </Link>
      </div>

      {/* Phase: Setup */}
      {phase === "setup" && (
        <div className="flex-1 overflow-y-auto">
          <TestSetup
            topicId={topic.id}
            topicName={topic.name}
            onStart={(type, strategic) => handleStartTest(type, strategic)}
            topicNames={allTopicNames}
          />
        </div>
      )}

      {/* Phase: Testing — Multiple Choice */}
      {phase === "testing" && currentTest && currentTest.type === "multiple-choice" && (
        <MCQuizSession
          topicId={topic.id}
          topicName={topic.name}
          strategic={isStrategic}
          onComplete={handleTestComplete}
        />
      )}

      {/* Phase: Testing — Other types */}
      {phase === "testing" && currentTest && currentTest.type !== "multiple-choice" && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <TestSession
              topicId={topic.id}
              topicName={topic.name}
              type={currentTest.type}
              strategic={isStrategic}
              onComplete={handleTestComplete}
            />
          </div>
          {/* Side panel score */}
          <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-border lg:block">
            <ScoreIndicator
              currentScore={currentTest.currentScore}
              maxScore={currentTest.maxScore}
              passThreshold={0.7}
              answers={currentTest.answers.map((a) => ({
                score: a.score,
                maxScore: a.maxScore,
                passed: a.passed,
              }))}
            />
          </div>
        </div>
      )}

      {/* Phase: Results */}
      {phase === "results" && (
        <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">테스트 결과</h1>
            <div className="mt-2"><p className="text-muted-foreground">{topic.name}</p>{allTopicNames.length > 0 && (<div className="flex flex-wrap justify-center gap-1.5 mt-2">{allTopicNames.map((n) => (<span key={n} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{n}</span>))}</div>)}</div>
          </div>

          {/* Score summary */}
          {completedAnswers.length > 0 && (
            <div className="space-y-4">
              {(() => {
                const totalScore = completedAnswers.reduce(
                  (sum, a) => sum + a.score,
                  0
                );
                const maxScore = completedAnswers.reduce(
                  (sum, a) => sum + a.maxScore,
                  0
                );
                const passed = maxScore > 0 && totalScore / maxScore >= 0.7;

                return (
                  <div
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-8 ${
                      passed
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="size-12 text-green-500" />
                    ) : (
                      <XCircle className="size-12 text-red-500" />
                    )}
                    <div className="text-center">
                      <p
                        className={`text-3xl font-bold ${
                          passed
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {totalScore} / {maxScore}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {passed ? "합격" : "불합격"} (합격선: 70%)
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Answer details */}
              <div className="space-y-4">
                {completedAnswers.map((answer, idx) => (
                  <AnswerDetailCard key={idx} answer={answer} index={idx} isMC={currentTest?.type === "multiple-choice"} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                reset();
              }}
            >
              다시 테스트
            </Button>
          </div>
        </div>
        </div>
      )}

      {/* Phase: Comparison */}
      {phase === "comparison" && comparison && (
        <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">모범답안 비교</h1>
            <div className="mt-2"><p className="text-muted-foreground">{topic.name}</p>{allTopicNames.length > 0 && (<div className="flex flex-wrap justify-center gap-1.5 mt-2">{allTopicNames.map((n) => (<span key={n} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{n}</span>))}</div>)}</div>
          </div>

          {comparison.results.map((result, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="text-lg font-semibold">문제 {idx + 1}</h2>
              <p className="text-sm text-muted-foreground mb-3">{result.question}</p>
              <AnswerComparison
                userAnswer={completedAnswers[idx]?.userAnswer || ""}
                modelAnswer={result.modelAnswer}
                gaps={result.gaps || []}
                feedback={result.feedback || ""}
                onFollowUp={handleFollowUp}
              />
            </div>
          ))}

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setPhase("results")}>
              결과로 돌아가기
            </Button>
          </div>
        </div>
        </div>
      )}

      {/* Phase: Follow-up */}
      {phase === "followup" && comparison && (
        <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">후속 Q&A</h1>
            <div className="mt-2"><p className="text-muted-foreground">{topic.name}</p>{allTopicNames.length > 0 && (<div className="flex flex-wrap justify-center gap-1.5 mt-2">{allTopicNames.map((n) => (<span key={n} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{n}</span>))}</div>)}</div>
          </div>

          {comparison.results.map((result, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="text-lg font-semibold">문제 {idx + 1}</h2>
              <AnswerComparison
                userAnswer={completedAnswers[idx]?.userAnswer || ""}
                modelAnswer={result.modelAnswer}
                gaps={result.gaps || []}
                feedback={result.feedback || ""}
                onFollowUp={() => {}}
              />
            </div>
          ))}

          <FollowUpChat
            topicId={topic.id}
            testId={testResultId}
            modelAnswer={comparison.results.map(r => r.modelAnswer).join("\n\n")}
            onComplete={handleFollowUpComplete}
          />
        </div>
        </div>
      )}
    </main>
  );
}

export default function TestPage() {
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
      <TestPageContent />
    </React.Suspense>
  );
}

function TestTopicSelector() {
  const router = useRouter();
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [topicDetails, setTopicDetails] = React.useState<Record<string, { level: string; hasTests: boolean; testResults: TestResult[] }>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedResult, setSelectedResult] = React.useState<TestResult | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/topics");
        const json: ApiResult<Topic[]> = await res.json();
        if (json.success) {
          setTopics(json.data);
          const details: Record<string, { level: string; hasTests: boolean; testResults: TestResult[] }> = {};
          await Promise.all(json.data.map(async (t: Topic) => {
            try {
              const detailRes = await fetch(`/api/topics/${t.id}/detail`);
              const detailJson = await detailRes.json();
              if (detailJson.success) {
                details[t.id] = {
                  level: detailJson.data.diagnosis?.level || "",
                  hasTests: (detailJson.data.testResults?.length || 0) > 0,
                  testResults: detailJson.data.testResults || [],
                };
              }
            } catch { /* ignore */ }
          }));
          setTopicDetails(details);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        </div>
      </main>
    );
  }

  if (topics.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <FileCheck className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">테스트할 주제가 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">대시보드에서 주제를 추가하고 학습을 시작하세요.</p>
          </div>
          <Link href="/" className={buttonVariants({ size: "sm" })}>
            대시보드로 이동
          </Link>
        </div>
      </main>
    );
  }

  const levelConfig: Record<string, { label: string; className: string }> = {
    beginner: { label: "초급", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-0" },
    intermediate: { label: "중급", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0" },
    advanced: { label: "고급", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0" },
  };

  const typeLabel: Record<string, string> = {
    "deep-learning": "깊은 학습",
    "multiple-choice": "객관식",
    "short-answer": "주관식",
  };

  // Sort: tested > in-progress > new
  const sorted = [...topics].sort((a, b) => {
    const aHasTests = topicDetails[a.id]?.hasTests ? 0 : 1;
    const bHasTests = topicDetails[b.id]?.hasTests ? 0 : 1;
    if (aHasTests !== bHasTests) return aHasTests - bHasTests;
    const statusOrder = (s: string) => s === "in-progress" ? 0 : s === "new" ? 1 : 2;
    return statusOrder(a.status) - statusOrder(b.status) || a.name.localeCompare(b.name);
  });

  // All test results across topics, sorted newest first
  const allTestResults: (TestResult & { topicName: string })[] = [];
  for (const t of topics) {
    const detail = topicDetails[t.id];
    if (detail?.testResults) {
      for (const r of detail.testResults) {
        allTestResults.push({ ...r, topicName: t.name });
      }
    }
  }
  allTestResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">테스트</h1>
          <p className="mt-1 text-sm text-muted-foreground">테스트할 주제를 선택하세요</p>
        </div>

        {/* All topics mixed test */}
        {topics.length >= 2 && (
          <div
            className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-5 cursor-pointer transition-colors hover:border-primary/50 mb-6"
            onClick={() => router.push("/test?topic=all")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") router.push("/test?topic=all"); }}
          >
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shuffle className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">전체 주제 테스트</p>
                <p className="text-xs text-muted-foreground">{topics.length}개 주제에서 랜덤 출제</p>
              </div>
            </div>
          </div>
        )}

        {/* Topic cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((t) => {
            const detail = topicDetails[t.id];
            const level = detail?.level;
            const testCount = detail?.testResults?.length || 0;
            const latestTest = detail?.testResults?.[0];
            const latestScore = latestTest ? Math.round((latestTest.totalScore / latestTest.maxTotalScore) * 100) : null;

            return (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 transition-colors hover:border-primary/50 cursor-pointer"
                onClick={() => router.push(`/test?topic=${t.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/test?topic=${t.id}`); }}
              >
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold leading-tight">{t.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {level && levelConfig[level] && (
                        <Badge variant="secondary" className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${levelConfig[level].className}`}>
                          {levelConfig[level].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <Progress value={t.progress} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{t.progress}%</span>
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileCheck className="size-3" />
                    <span>테스트 {testCount}회</span>
                  </div>
                  {latestScore !== null && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${latestScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      <Clock className="size-3" />
                      <span>최근 점수 {latestScore}%</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Test history section */}
        <div className="mt-10">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
            <h2 className="text-lg font-semibold">테스트 이력</h2>
          </div>

          {allTestResults.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">아직 테스트 이력이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTestResults.map((r) => {
                const pct = r.maxTotalScore > 0 ? Math.round((r.totalScore / r.maxTotalScore) * 100) : 0;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary/50"
                    onClick={() => setSelectedResult(r)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelectedResult(r); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 items-center justify-center rounded-lg ${r.passed ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                        {r.passed
                          ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                          : <XCircle className="size-4 text-red-600 dark:text-red-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{r.topicName}</span>
                          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">{typeLabel[r.type] || r.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${r.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {pct}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/learn?topic=${r.topicId}&reviewTest=${r.id}`);
                        }}
                      >
                        <RefreshCw className="size-3" />
                        복습
                      </Button>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Test detail modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedResult(null)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
              <div>
                <h3 className="text-base font-semibold">테스트 상세</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(allTestResults.find(r => r.id === selectedResult.id) as (TestResult & { topicName: string }) | undefined)?.topicName || ""} &middot; {typeLabel[selectedResult.type] || selectedResult.type} &middot; {new Date(selectedResult.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setSelectedResult(null)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {/* Score summary */}
              {(() => {
                const pct = selectedResult.maxTotalScore > 0 ? Math.round((selectedResult.totalScore / selectedResult.maxTotalScore) * 100) : 0;
                return (
                  <div className={`flex items-center justify-center gap-4 rounded-xl border p-5 ${selectedResult.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    {selectedResult.passed ? <CheckCircle2 className="size-8 text-emerald-500" /> : <XCircle className="size-8 text-red-500" />}
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${selectedResult.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {selectedResult.totalScore} / {selectedResult.maxTotalScore} ({pct}%)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedResult.passed ? "합격" : "불합격"} (합격선: 70%)</p>
                    </div>
                  </div>
                );
              })()}

              {/* Per-question detail */}
              <div className="space-y-3">
                {selectedResult.answers.map((a, idx) => (
                  <AnswerDetailCard key={idx} answer={a} index={idx} isMC={selectedResult.type === "multiple-choice"} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
