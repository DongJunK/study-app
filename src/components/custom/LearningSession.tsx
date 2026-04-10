"use client";

import * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { StreamingChat } from "@/components/custom/StreamingChat/StreamingChat";
import { Clock, CheckCircle, FlaskConical } from "lucide-react";
import type { Message, LearningMode, ContentFormat, LearningSession as LearningSessionType } from "@/types/session";

interface LearningSessionProps {
  topicId: string;
  topicName: string;
  conceptTitle: string;
  mode: LearningMode;
  formats: ContentFormat[];
  roadmapItemId: string | null;
  sessionId: string;
  onSessionEnd: (messages: Message[], completed: boolean) => void;
  reviewQuestions?: string[];
}

const NOTIFY_AT = 15 * 60; // 15분 경과 알림

export function LearningSession({
  topicId,
  topicName,
  conceptTitle,
  mode,
  formats,
  roadmapItemId,
  sessionId,
  onSessionEnd,
  reviewQuestions,
}: LearningSessionProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [notified, setNotified] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [initialized, setInitialized] = React.useState(false);

  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIndicatorRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = React.useRef(new Date().toISOString());
  const messagesRef = React.useRef<Message[]>(messages);

  // Keep messagesRef in sync
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Timer count-up
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 15분 경과 알림
  React.useEffect(() => {
    if (elapsed >= NOTIFY_AT && !notified) {
      setNotified(true);
      if (typeof window !== "undefined") {
        import("sonner").then(({ toast }) => {
          toast.info("학습 시간이 15분 경과했습니다", { duration: 5000 });
        });
      }
    }
  }, [elapsed, notified]);

  // Auto-save with 1s debounce
  React.useEffect(() => {
    if (messages.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveSession();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Initialize - send first message to get AI response
  React.useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    fetchStreamingResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedRef = React.useRef(false);

  async function saveSession(isFinalSave = false) {
    setSaveStatus("saving");
    try {
      const session: LearningSessionType = {
        id: sessionId,
        topicId,
        mode,
        formats,
        messages: messagesRef.current,
        startedAt: startedAtRef.current,
        endedAt: isFinalSave ? new Date().toISOString() : null,
        summary: null,
        roadmapItemId,
        elapsedSeconds: elapsed,
        completed: completedRef.current,
      };

      await fetch("/api/learn/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, isFinalSave }),
      });

      setSaveStatus("saved");
      if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
      saveIndicatorRef.current = setTimeout(() => setSaveStatus("idle"), 500);
    } catch {
      setSaveStatus("idle");
    }
  }

  async function fetchStreamingResponse(userMessage?: string) {
    setIsStreaming(true);

    // Build previous messages context
    const currentMessages = messagesRef.current;
    let previousMessages: string | undefined;
    if (currentMessages.length > 0) {
      previousMessages = currentMessages
        .map((m) => `${m.role === "user" ? "학생" : "교사"}: ${m.content}`)
        .join("\n\n");
    }

    // Add placeholder for AI response
    const aiMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const res = await fetch("/api/learn/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName,
          conceptTitle,
          mode,
          formats,
          previousMessages,
          ...(reviewQuestions && reviewQuestions.length > 0 && !previousMessages ? { reviewQuestions } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              accumulated += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: accumulated,
                };
                return updated;
              });
            } else if (parsed.type === "done") {
              accumulated = parsed.content || accumulated;
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
            // Skip unparseable lines
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].content === "") {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "죄송합니다, 응답을 가져오는데 실패했습니다. 다시 시도해주세요.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSendMessage(content: string) {
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Small delay to allow state update before sending
    setTimeout(() => {
      fetchStreamingResponse(content);
    }, 50);
  }

  async function handleEndSession() {
    await saveSession(true);
    onSessionEnd(messagesRef.current, false);
  }

  async function handleComplete() {
    completedRef.current = true;
    await saveSession(true);
    onSessionEnd(messagesRef.current, true);
  }

  // Format timer display
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timerDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const modeLabel = {
    basic: "기본형",
    socratic: "소크라테스",
    feynman: "파인만",
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <FlaskConical className="size-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">{conceptTitle}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {modeLabel[mode]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save indicator */}
          {saveStatus === "saved" && (
            <CheckCircle className="size-3.5 text-emerald-500" />
          )}

          {/* Timer */}
          <div
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <Clock className="size-3.5" />
            <span className="font-mono">{timerDisplay}</span>
          </div>

          {/* Test button */}
          <Link
            href={`/test?topic=${topicId}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            테스트로 전환
          </Link>

          {/* Complete learning button */}
          <Button size="sm" onClick={handleComplete} disabled={isStreaming} className="gap-1.5">
            <CheckCircle className="size-3.5" />
            학습 완료
          </Button>

          {/* End session button */}
          <Button variant="ghost" size="sm" onClick={handleEndSession}>
            나가기
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <StreamingChat
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          placeholder="답변을 입력하세요..."
        />
      </div>
    </div>
  );
}
