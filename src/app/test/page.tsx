"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { TestSetup } from "@/components/custom/TestSetup";
import { TestSession } from "@/components/custom/TestSession";
import { AnswerComparison } from "@/components/custom/AnswerComparison";
import { FollowUpChat } from "@/components/custom/FollowUpChat";
import { ScoreIndicator } from "@/components/custom/ScoreIndicator";
import { useTestStore } from "@/stores/testStore";
import type { Topic } from "@/types/topic";
import type { TestType, TestAnswer, TestResult } from "@/types/test";
import { ArrowLeft, CheckCircle2, XCircle, FileCheck, ClipboardCheck, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResult } from "@/types/api";

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
    modelAnswer: string;
    gaps: string[];
    feedback: string;
  } | null>(null);
  const [testResultId, setTestResultId] = React.useState<string>("");
  const [comparingLoading, setComparingLoading] = React.useState(false);

  // Fetch topic
  React.useEffect(() => {
    if (!topicId) {
      setLoading(false);
      return;
    }
    fetch(`/api/topics/${topicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTopic(data.data);
      })
      .finally(() => setLoading(false));
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

  function handleStartTest(type: TestType, duration: number) {
    startTest(topic!.id, type, duration);
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
      await fetch("/api/test/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic!.id, result }),
      });
    } catch {
      // silent fail for save
    }
  }

  async function handleRequestComparison() {
    if (completedAnswers.length === 0) return;
    setComparingLoading(true);

    // Use the last answered question for comparison
    const lastAnswer = completedAnswers[completedAnswers.length - 1];
    try {
      const res = await fetch("/api/test/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: lastAnswer.question || "마지막 테스트 질문",
          userAnswer: lastAnswer.userAnswer || lastAnswer.feedback,
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
    <main className="flex flex-1 flex-col overflow-hidden">
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
        <TestSetup
          topicId={topic.id}
          topicName={topic.name}
          onStart={handleStartTest}
        />
      )}

      {/* Phase: Testing */}
      {phase === "testing" && currentTest && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TestSession
              topicId={topic.id}
              topicName={topic.name}
              type={currentTest.type}
              duration={currentTest.duration}
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
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">테스트 결과</h1>
            <p className="mt-2 text-muted-foreground">{topic.name}</p>
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

              {/* Per-answer breakdown */}
              <div className="space-y-2">
                {completedAnswers.map((answer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <span className="text-sm">질문 {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {answer.score}/{answer.maxScore}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          answer.passed
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {answer.passed ? "통과" : "미달"}
                      </span>
                    </div>
                  </div>
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
            <Button
              onClick={handleRequestComparison}
              disabled={comparingLoading}
            >
              {comparingLoading ? "분석 중..." : "모범답안 비교"}
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Comparison */}
      {phase === "comparison" && comparison && (
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">모범답안 비교</h1>
            <p className="mt-2 text-muted-foreground">{topic.name}</p>
          </div>

          <AnswerComparison
            userAnswer={
              completedAnswers.length > 0
                ? completedAnswers[completedAnswers.length - 1].feedback
                : ""
            }
            modelAnswer={comparison.modelAnswer}
            gaps={comparison.gaps}
            feedback={comparison.feedback}
            onFollowUp={handleFollowUp}
          />

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setPhase("results")}>
              결과로 돌아가기
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Follow-up */}
      {phase === "followup" && comparison && (
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">후속 Q&A</h1>
            <p className="mt-2 text-muted-foreground">{topic.name}</p>
          </div>

          <AnswerComparison
            userAnswer={
              completedAnswers.length > 0
                ? completedAnswers[completedAnswers.length - 1].feedback
                : ""
            }
            modelAnswer={comparison.modelAnswer}
            gaps={comparison.gaps}
            feedback={comparison.feedback}
            onFollowUp={() => {}}
          />

          <FollowUpChat
            topicId={topic.id}
            testId={testResultId}
            modelAnswer={comparison.modelAnswer}
            onComplete={handleFollowUpComplete}
          />
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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/topics");
        const json: ApiResult<Topic[]> = await res.json();
        if (json.success) setTopics(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
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

  const statusLabel: Record<string, string> = { new: "신규", "in-progress": "진행중", completed: "완료" };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">테스트</h1>
        <p className="text-sm text-muted-foreground mb-6">테스트할 주제를 선택하세요</p>
        <div className="space-y-3">
          {topics.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => router.push(`/test?topic=${t.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/test?topic=${t.id}`); }}
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <ClipboardCheck className="size-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">{statusLabel[t.status] ?? t.status}</Badge>
                    <span className="text-xs text-muted-foreground">{t.progress}% 완료</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <Play className="size-3.5" />
                테스트하기
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
