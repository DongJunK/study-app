"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiagnosisChat } from "@/components/custom/DiagnosisChat";
import { RoadmapView } from "@/components/custom/RoadmapView";
import { LearningSetup } from "@/components/custom/LearningSetup";
import { LearningSession } from "@/components/custom/LearningSession";
import { SessionSummary } from "@/components/custom/SessionSummary";
import { RoadmapAddChat } from "@/components/custom/RoadmapAddChat";
import { useSessionStore } from "@/stores/sessionStore";
import { Loader2, BookOpen, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Topic, Roadmap, RoadmapItem } from "@/types/topic";
import type { LearningMode, ContentFormat, Message, LastSession } from "@/types/session";
import type { ApiResult } from "@/types/api";

type LearnPhase =
  | "loading"
  | "no-topic"
  | "diagnosis"
  | "generating-roadmap"
  | "roadmap"
  | "setup"
  | "learning"
  | "summary"
  | "roadmap-add";

interface SummaryData {
  learned: string[];
  uncertain: string[];
  nextSteps: string[];
}

function LearnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topic");
  const itemParam = searchParams.get("item");
  const resumeParam = searchParams.get("resume");
  const rediagnoseParam = searchParams.get("rediagnose");

  const [phase, setPhase] = React.useState<LearnPhase>("loading");
  const [topic, setTopic] = React.useState<Topic | null>(null);
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<RoadmapItem | null>(null);
  const [learningMode, setLearningMode] = React.useState<LearningMode | null>(null);
  const [learningFormats, setLearningFormats] = React.useState<ContentFormat[]>(["text"]);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [summaryData, setSummaryData] = React.useState<SummaryData | null>(null);
  const { reset } = useSessionStore();

  // Reset session store on mount or topic change
  React.useEffect(() => {
    reset();
  }, [topicId, reset]);

  // Fetch topic data and determine phase
  React.useEffect(() => {
    if (!topicId) {
      setPhase("no-topic");
      return;
    }

    async function loadTopicData() {
      try {
        // Fetch topic
        const topicRes = await fetch(`/api/topics/${topicId}`);
        const topicJson: ApiResult<Topic> = await topicRes.json();

        if (!topicJson.success) {
          setPhase("no-topic");
          return;
        }

        setTopic(topicJson.data);

        // Handle rediagnose: clear existing diagnosis and session, start fresh
        if (rediagnoseParam === "true") {
          await Promise.all([
            fetch(`/api/topics/${topicId}/diagnosis/session`, { method: "DELETE" }).catch(() => {}),
            fetch(`/api/topics/${topicId}/diagnosis/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reset: true }),
            }).catch(() => {}),
          ]);
          toast.info("수준 재진단을 시작합니다");
          setPhase("diagnosis");
          return;
        }

        // Check diagnosis status
        const diagRes = await fetch(`/api/topics/${topicId}/diagnosis/status`);
        const diagJson = await diagRes.json();

        if (!diagJson.success || !diagJson.data.hasDiagnosis) {
          // Also check if there's an in-progress diagnosis session
          // (handles the case where diagnosis was started but not completed)
          try {
            const diagSessionRes = await fetch(
              `/api/topics/${topicId}/diagnosis/session`
            );
            const diagSessionJson = await diagSessionRes.json();
            if (
              diagSessionJson.success &&
              diagSessionJson.data &&
              !diagSessionJson.data.isComplete &&
              diagSessionJson.data.messages?.length > 0
            ) {
              // In-progress session exists - go to diagnosis phase (DiagnosisChat will resume it)
              setPhase("diagnosis");
              return;
            }
          } catch {
            // Fall through to fresh diagnosis
          }
          setPhase("diagnosis");
          return;
        }

        // Check roadmap
        const roadmapRes = await fetch(`/api/topics/${topicId}/roadmap`);
        const roadmapJson: ApiResult<Roadmap> = await roadmapRes.json();

        if (
          roadmapJson.success &&
          roadmapJson.data &&
          roadmapJson.data.items.length > 0
        ) {
          setRoadmap(roadmapJson.data);

          // Resume from last session
          if (resumeParam === "true") {
            try {
              const sessionRes = await fetch("/api/session");
              const sessionJson: ApiResult<LastSession | null> = await sessionRes.json();
              if (
                sessionJson.success &&
                sessionJson.data &&
                sessionJson.data.topicId === topicId &&
                sessionJson.data.roadmapItemId
              ) {
                const lastSession = sessionJson.data;
                const item = roadmapJson.data.items.find(
                  (i) => i.id === lastSession.roadmapItemId
                );
                if (item && (item.status === "available" || item.status === "in-progress")) {
                  setSelectedItem(item);
                  toast.info("지난 세션에서 이어서 학습합니다");
                  setPhase("setup");
                  return;
                }
              }
            } catch {
              // Fall through to normal flow
            }
          }

          // If item param is set, go directly to setup
          if (itemParam) {
            const item = roadmapJson.data.items.find((i) => i.id === itemParam);
            if (item && (item.status === "available" || item.status === "in-progress")) {
              setSelectedItem(item);
              setPhase("setup");
              return;
            }
          }

          setPhase("roadmap");
        } else {
          // Has diagnosis but no roadmap - auto-generate
          setPhase("generating-roadmap");
          await generateRoadmap(JSON.stringify(diagJson.data.diagnosis));
        }
      } catch {
        setPhase("no-topic");
      }
    }

    loadTopicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function handleDiagnosisComplete(diagnosisResult: string, additionalTopics?: string[]) {
    if (!topicId) return;

    // Save diagnosis
    try {
      const parsed = JSON.parse(diagnosisResult);
      await fetch(`/api/topics/${topicId}/diagnosis/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
    } catch {
      // Continue even if save fails
    }

    // Generate roadmap
    setPhase("generating-roadmap");
    await generateRoadmap(diagnosisResult, additionalTopics);
  }

  async function generateRoadmap(diagnosisResult: string, additionalTopics?: string[]) {
    if (!topicId) return;

    try {
      const res = await fetch(`/api/topics/${topicId}/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisResult, additionalTopics: additionalTopics || [] }),
      });
      const json: ApiResult<Roadmap> = await res.json();

      if (json.success) {
        setRoadmap(json.data);
        setPhase("roadmap");
      } else {
        // Fallback - go back to diagnosis
        setPhase("diagnosis");
      }
    } catch {
      setPhase("diagnosis");
    }
  }

  async function handleAddRoadmapItem(title: string) {
    if (!topicId || !roadmap) return;

    try {
      const res = await fetch(`/api/topics/${topicId}/roadmap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addItem: { title } }),
      });
      const json: ApiResult<Roadmap> = await res.json();
      if (json.success) {
        setRoadmap(json.data);
      }
    } catch {
      // Silently fail
    }
  }

  async function handleRemoveRoadmapItem(itemId: string) {
    if (!topicId || !roadmap) return;

    try {
      const res = await fetch(`/api/topics/${topicId}/roadmap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeItem: { itemId } }),
      });
      const json: ApiResult<Roadmap> = await res.json();
      if (json.success) {
        setRoadmap(json.data);
      }
    } catch {
      // Silently fail
    }
  }

  function handleStartLearning(itemId: string) {
    if (!roadmap) return;
    const item = roadmap.items.find((i) => i.id === itemId);
    if (!item) return;
    setSelectedItem(item);
    setPhase("setup");
  }

  function handleSetupStart(mode: LearningMode, formats: ContentFormat[]) {
    setLearningMode(mode);
    setLearningFormats(formats);
    // Generate a session ID
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setPhase("learning");
  }

  async function handleSessionEnd(messages: Message[], completed: boolean = false) {
    if (!topicId) return;

    // Generate summary
    try {
      const messagesStr = messages
        .map((m) => `${m.role === "user" ? "학생" : "교사"}: ${m.content}`)
        .join("\n\n");

      const res = await fetch("/api/learn/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesStr }),
      });
      const json = await res.json();

      if (json.success) {
        setSummaryData(json.data);
      } else {
        setSummaryData({
          learned: ["학습 세션을 완료했습니다."],
          uncertain: [],
          nextSteps: ["다음 항목을 학습해보세요."],
        });
      }
    } catch {
      setSummaryData({
        learned: ["학습 세션을 완료했습니다."],
        uncertain: [],
        nextSteps: ["다음 항목을 학습해보세요."],
      });
    }

    // Update roadmap item status only when explicitly completed
    console.log("[handleSessionEnd] completed:", completed, "selectedItem:", selectedItem?.id, "roadmap:", !!roadmap);
    if (completed && selectedItem && roadmap) {
      try {
        const patchRes = await fetch(`/api/topics/${topicId}/roadmap`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updateItemStatus: {
              itemId: selectedItem.id,
              status: "completed",
            },
          }),
        });
        const patchJson = await patchRes.json();
        console.log("[handleSessionEnd] PATCH result:", patchJson);

        // Update local roadmap state
        setRoadmap((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((item) => {
            if (item.id === selectedItem.id) {
              return { ...item, status: "completed" as const };
            }
            return item;
          });

          // Find next locked item and make it available
          const completedIndex = updatedItems.findIndex((i) => i.id === selectedItem.id);
          const sortedItems = [...updatedItems].sort((a, b) => a.order - b.order);
          const nextLocked = sortedItems.find(
            (i) => i.status === "locked" && i.order > (updatedItems[completedIndex]?.order ?? 0)
          );
          if (nextLocked) {
            const nextIdx = updatedItems.findIndex((i) => i.id === nextLocked.id);
            if (nextIdx >= 0) {
              updatedItems[nextIdx] = { ...updatedItems[nextIdx], status: "available" };
            }
          }

          return { ...prev, items: updatedItems };
        });
      } catch {
        // Silently fail
      }
    }

    setPhase("summary");
  }

  function handleContinueLearning() {
    setSelectedItem(null);
    setLearningMode(null);
    setSummaryData(null);
    setPhase("roadmap");
  }

  function handleGoToDashboard() {
    router.push("/");
  }

  // Render based on phase
  if (phase === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (phase === "no-topic") {
    return <TopicSelector />;
  }

  if (phase === "diagnosis" && topic) {
    return (
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <DiagnosisChat
          topicId={topic.id}
          topicName={topic.name}
          onDiagnosisComplete={(result, additionalTopics) => handleDiagnosisComplete(result, additionalTopics)}
        />
      </main>
    );
  }

  if (phase === "generating-roadmap") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <div>
            <h2 className="text-lg font-semibold">로드맵 생성 중...</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              진단 결과를 바탕으로 맞춤 학습 로드맵을 만들고 있습니다.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "roadmap" && roadmap && topic) {
    return (
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{topic.name}</h2>
              <p className="text-sm text-muted-foreground">
                학습 로드맵 - 항목을 클릭하여 학습을 시작하세요
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPhase("roadmap-add")} className="gap-1.5">
              <Sparkles className="size-3.5" />
              AI 로드맵 추가
            </Button>
          </div>
        </div>
        <RoadmapView
          topicId={topic.id}
          roadmap={roadmap}
          onAddItem={handleAddRoadmapItem}
          onRemoveItem={handleRemoveRoadmapItem}
          onStartLearning={handleStartLearning}
        />
      </main>
    );
  }

  if (phase === "roadmap-add" && roadmap && topic) {
    return (
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <RoadmapAddChat
          topicId={topic.id}
          topicName={topic.name}
          roadmap={roadmap}
          onAddItems={async (items) => {
            for (const item of items) {
              try {
                await fetch(`/api/topics/${topicId}/roadmap`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ addItem: { title: item.title } }),
                });
              } catch { /* ignore */ }
            }
            // Refresh roadmap
            const res = await fetch(`/api/topics/${topicId}/roadmap`);
            const json = await res.json();
            if (json.success) setRoadmap(json.data);
            setPhase("roadmap");
          }}
          onBack={() => setPhase("roadmap")}
        />
      </main>
    );
  }

  if (phase === "setup" && selectedItem && topic) {
    return (
      <main className="flex flex-1 flex-col overflow-y-auto">
        <LearningSetup
          topicId={topic.id}
          conceptTitle={selectedItem.title}
          onStart={handleSetupStart}
          onResumeLast={(sid, mode, formats) => {
            setLearningMode(mode);
            setLearningFormats(formats);
            setSessionId(sid);
            setPhase("learning");
          }}
        />
      </main>
    );
  }

  if (phase === "learning" && selectedItem && topic && learningMode) {
    return (
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <LearningSession
          topicId={topic.id}
          topicName={topic.name}
          conceptTitle={selectedItem.title}
          mode={learningMode}
          formats={learningFormats}
          roadmapItemId={selectedItem.id}
          sessionId={sessionId}
          onSessionEnd={handleSessionEnd}
        />
      </main>
    );
  }

  if (phase === "summary" && summaryData) {
    return (
      <main className="flex flex-1 flex-col overflow-y-auto">
        <SessionSummary
          learned={summaryData.learned}
          uncertain={summaryData.uncertain}
          nextSteps={summaryData.nextSteps}
          onContinue={handleContinueLearning}
          onDashboard={handleGoToDashboard}
        />
      </main>
    );
  }

  return null;
}

export default function LearnPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-4">
          <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
        </main>
      }
    >
      <LearnContent />
    </React.Suspense>
  );
}

function TopicSelector() {
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
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">학습할 주제가 없습니다</p>
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
        <h1 className="text-2xl font-semibold mb-2">학습</h1>
        <p className="text-sm text-muted-foreground mb-6">학습할 주제를 선택하세요</p>
        <div className="space-y-3">
          {[...topics].sort((a, b) => { const statusOrder = (s: string) => s === "in-progress" ? 0 : s === "new" ? 1 : 2; const so = statusOrder(a.status) - statusOrder(b.status); if (so !== 0) return so; const po = b.progress - a.progress; if (po !== 0) return po; return a.name.localeCompare(b.name); }).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => router.push(`/learn?topic=${t.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/learn?topic=${t.id}`); }}
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
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
                학습하기
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
