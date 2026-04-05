"use client";

import * as React from "react";
import { StreamingChat } from "@/components/custom/StreamingChat/StreamingChat";
import { Button } from "@/components/ui/button";
import { WeaknessTag } from "@/components/custom/WeaknessTag";
import type { Message } from "@/types/session";
import { ArrowRight, CheckCircle, CheckCircle2, XCircle } from "lucide-react";

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

  React.useEffect(() => {
    startFocusLearning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function streamResponse(
    url: string,
    body: Record<string, unknown>,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    isAppend: boolean
  ): Promise<string> {
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    if (isAppend) {
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      setMessages([assistantMsg]);
    }

    setIsStreaming(true);
    let accumulated = "";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
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
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
                return msgs;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: "응답을 받는데 실패했습니다." };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
    }

    return accumulated;
  }

  async function startFocusLearning() {
    await streamResponse(
      "/api/weakness/focus-learn",
      { topicId, concept, topicName },
      setLearningMessages,
      false
    );
  }

  async function handleLearningMessage(userMessage: string) {
    const userMsg: Message = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setLearningMessages((prev) => [...prev, userMsg]);

    const allMessages = [...learningMessages, userMsg];
    const previousMessages = allMessages.map((m) => `${m.role === "user" ? "학생" : "튜터"}: ${m.content}`).join("\n");

    await streamResponse(
      "/api/weakness/focus-learn",
      { topicId, concept, topicName, previousMessages },
      setLearningMessages,
      true
    );
  }

  function handleLearningComplete() {
    // 학습 완료 → 자동으로 퀴즈 전환
    startQuiz();
  }

  async function startQuiz() {
    setPhase("quiz");
    await streamResponse(
      "/api/weakness/quick-quiz",
      { topicId, concept, topicName },
      setQuizMessages,
      false
    );
  }

  async function handleQuizMessage(userMessage: string) {
    const userMsg: Message = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setQuizMessages((prev) => [...prev, userMsg]);

    const allMessages = [...quizMessages, userMsg];
    const previousMessages = allMessages.map((m) => `${m.role === "user" ? "학생" : "출제자"}: ${m.content}`).join("\n");

    const accumulated = await streamResponse(
      "/api/weakness/quick-quiz",
      { topicId, concept, topicName, previousMessages },
      setQuizMessages,
      true
    );

    // Check for quiz-result
    const finalMatch = accumulated.match(/```json\s*\n?\s*(\{[^}]*"type"\s*:\s*"quiz-result"[^}]*\})/);
    if (finalMatch) {
      try {
        const result = JSON.parse(finalMatch[1]);
        setQuizPassed(result.passed === true);
        setPhase("result");
      } catch {
        setPhase("result");
      }
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
                약점을 극복했습니다. 약점 목록에서 숨겨집니다.
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
            <Button size="sm" onClick={handleLearningComplete} className="gap-1.5">
              <CheckCircle className="size-3.5" />
              학습 완료
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        <StreamingChat
          messages={phase === "learning" ? learningMessages : quizMessages}
          isStreaming={isStreaming}
          onSendMessage={phase === "learning" ? handleLearningMessage : handleQuizMessage}
          placeholder={phase === "learning" ? "질문이 있으면 물어보세요..." : "답변을 입력하세요..."}
        />
      </div>
    </div>
  );
}
