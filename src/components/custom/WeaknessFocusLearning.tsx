"use client";

import * as React from "react";
import { StreamingChat } from "@/components/custom/StreamingChat/StreamingChat";
import { Button } from "@/components/ui/button";
import { WeaknessTag } from "@/components/custom/WeaknessTag";
import type { Message } from "@/types/session";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

type Phase = "learning" | "quiz" | "result";

interface WeaknessFocusLearningProps {
  topicId: string;
  topicName: string;
  concept: string;
  onComplete: (passed: boolean) => void;
}

export function WeaknessFocusLearning({
  topicId,
  topicName,
  concept,
  onComplete,
}: WeaknessFocusLearningProps) {
  const [phase, setPhase] = React.useState<Phase>("learning");
  const [learningMessages, setLearningMessages] = React.useState<Message[]>([]);
  const [quizMessages, setQuizMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [quizPassed, setQuizPassed] = React.useState(false);

  // Start focus learning on mount
  React.useEffect(() => {
    startFocusLearning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startFocusLearning() {
    setIsStreaming(true);

    // Add initial assistant message placeholder
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setLearningMessages([assistantMsg]);

    try {
      const res = await fetch("/api/weakness/focus-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, concept, topicName }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              accumulated += event.content;
              setLearningMessages([
                { role: "assistant", content: accumulated, timestamp: assistantMsg.timestamp },
              ]);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch {
      setLearningMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "죄송합니다. 학습 세션을 시작하는데 문제가 발생했습니다.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleLearningMessage(userMessage: string) {
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setLearningMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      // Build conversation context
      const allMessages = [...learningMessages, userMsg];
      const previousMessages = allMessages
        .map((m) => `${m.role === "user" ? "학생" : "튜터"}: ${m.content}`)
        .join("\n");

      const res = await fetch("/api/weakness/focus-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          concept,
          topicName,
          previousMessages,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              accumulated += event.content;
              setLearningMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: accumulated,
                };
                return msgs;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setLearningMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: "응답을 받는데 실패했습니다.",
        };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function startQuiz() {
    setPhase("quiz");
    setIsStreaming(true);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setQuizMessages([assistantMsg]);

    try {
      const res = await fetch("/api/weakness/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, concept, topicName }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              accumulated += event.content;
              setQuizMessages([
                { role: "assistant", content: accumulated, timestamp: assistantMsg.timestamp },
              ]);
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setQuizMessages([
        {
          role: "assistant",
          content: "퀴즈를 시작하는데 문제가 발생했습니다.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleQuizMessage(userMessage: string) {
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setQuizMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      const allMessages = [...quizMessages, userMsg];
      const previousMessages = allMessages
        .map((m) => `${m.role === "user" ? "학생" : "출제자"}: ${m.content}`)
        .join("\n");

      const res = await fetch("/api/weakness/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          concept,
          topicName,
          previousMessages,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              accumulated += event.content;
              setQuizMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: accumulated,
                };
                return msgs;
              });

              // Check for quiz-result JSON in accumulated content
              const quizResultMatch = accumulated.match(
                /```json\s*\n?\s*\{[^}]*"type"\s*:\s*"quiz-result"[^}]*\}/
              );
              if (quizResultMatch) {
                try {
                  const jsonStr = quizResultMatch[0]
                    .replace(/```json\s*\n?\s*/, "")
                    .trim();
                  const result = JSON.parse(jsonStr);
                  setQuizPassed(result.passed === true);
                } catch {
                  // failed to parse result
                }
              }
            }
          } catch {
            // skip
          }
        }
      }

      // After stream ends, check if we got a result
      const finalMatch = accumulated.match(
        /```json\s*\n?\s*(\{[^}]*"type"\s*:\s*"quiz-result"[^}]*\})/
      );
      if (finalMatch) {
        try {
          const result = JSON.parse(finalMatch[1]);
          const passed = result.passed === true;
          setQuizPassed(passed);
          setPhase("result");
        } catch {
          // If we can't parse, move to result with fail
          setPhase("result");
        }
      }
    } catch {
      setQuizMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: "응답을 받는데 실패했습니다.",
        };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleFinish() {
    onComplete(quizPassed);
  }

  if (phase === "result") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          {quizPassed ? (
            <>
              <div className="rounded-full bg-emerald-500/10 p-6">
                <CheckCircle2 className="size-16 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold">축하합니다!</h2>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{concept}</span>{" "}
                개념을 성공적으로 보강했습니다.
              </p>
              <WeaknessTag concept={concept} status="understood" />
            </>
          ) : (
            <>
              <div className="rounded-full bg-amber-500/10 p-6">
                <XCircle className="size-16 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold">보강이 더 필요합니다</h2>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{concept}</span>{" "}
                개념을 조금 더 학습해보세요.
              </p>
              <WeaknessTag concept={concept} status="confused" />
            </>
          )}
          <Button onClick={handleFinish} className="mt-4 gap-2">
            돌아가기
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Phase header */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <WeaknessTag concept={concept} status="confused" />
            <span className="text-sm text-muted-foreground">
              {phase === "learning" ? "집중 학습" : "확인 퀴즈 (3문제)"}
            </span>
          </div>
          {phase === "learning" && !isStreaming && learningMessages.length > 1 && (
            <Button size="sm" onClick={startQuiz} className="gap-1.5">
              퀴즈 시작
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        <StreamingChat
          messages={phase === "learning" ? learningMessages : quizMessages}
          isStreaming={isStreaming}
          onSendMessage={
            phase === "learning" ? handleLearningMessage : handleQuizMessage
          }
          placeholder={
            phase === "learning"
              ? "질문이 있으면 물어보세요..."
              : "답변을 입력하세요..."
          }
        />
      </div>
    </div>
  );
}
