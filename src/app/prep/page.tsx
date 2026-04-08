"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StreamingChat } from "@/components/custom/StreamingChat/StreamingChat";
import type { Message } from "@/types/session";
import { ArrowLeft, Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

const FOLLOW_UP_SYSTEM_PROMPT =
  "너는 대형 IT 기업의 시니어 백엔드 면접관이다. 이전 대화를 이어서 면접을 계속 진행해라. 동일한 면접 규칙을 유지하며, 답변을 평가하고 꼬리질문을 계속해라. 한국어로 진행하세요.";

export default function InterviewPage() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [isStarted, setIsStarted] = React.useState(false);
  const [interviewEnded, setInterviewEnded] = React.useState(false);

  // Timer count-up
  React.useEffect(() => {
    if (!isStarted || interviewEnded) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, interviewEnded]);

  // Start interview on mount
  React.useEffect(() => {
    if (isStarted) return;
    setIsStarted(true);
    startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startInterview() {
    setIsStreaming(true);
    try {
      const res = await fetch("/api/prep/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages([assistantMsg]);

      await processStream(res.body);
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "면접을 시작하는데 실패했습니다. 다시 시도해주세요.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function processStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "text" && parsed.content) {
            accumulated += parsed.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulated,
              };
              return updated;
            });
          } else if (parsed.type === "done" && parsed.content) {
            accumulated = parsed.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulated,
              };
              return updated;
            });
          }
        } catch {
          // skip non-JSON
        }
      }
    }
  }

  async function handleSendMessage(content: string) {
    if (interviewEnded) return;

    const userMsg: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const conversationContext = messages
        .map((m) => `${m.role === "user" ? "지원자" : "면접관"}: ${m.content}`)
        .join("\n\n");

      const res = await fetch("/api/claude/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `이전 대화:\n${conversationContext}\n\n지원자: ${content}`,
          systemPrompt: FOLLOW_UP_SYSTEM_PROMPT,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await processStream(res.body);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "응답을 가져오는데 실패했습니다.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleEndInterview() {
    if (interviewEnded || isStreaming) return;
    setInterviewEnded(true);
    handleSendMessage("면접 종료");
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            대시보드로
          </Link>
          <h1 className="text-sm font-semibold">기술 면접 연습</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-medium bg-muted text-foreground">
            <Clock className="size-3.5" />
            {formatTime(elapsed)}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEndInterview}
            disabled={interviewEnded || isStreaming}
          >
            면접 종료
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <StreamingChat
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          placeholder={interviewEnded ? "면접이 종료되었습니다" : "답변을 입력하세요..."}
          disabled={interviewEnded}
        />
      </div>
    </div>
  );
}
