"use client";

import * as React from "react";
import { StreamingChat } from "@/components/custom/StreamingChat";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Sparkles, Send } from "lucide-react";
import type { Message } from "@/types/session";

const SUGGESTED_QUESTIONS = [
  "내 전체적인 학습 수준은 어떤 것 같아?",
  "지금 가장 먼저 공부해야 할 것은?",
  "내 약점 패턴을 분석해줘",
  "다음 테스트에서 좋은 점수를 받으려면?",
];

export default function QnaPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [learningContext, setLearningContext] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [topicCount, setTopicCount] = React.useState(0);

  // Load learning context on mount
  React.useEffect(() => {
    async function fetchContext() {
      try {
        const res = await fetch("/api/qna/context");
        const json = await res.json();
        if (json.success) {
          setLearningContext(json.data.context);
          setTopicCount(json.data.topicCount);
        }
      } catch {
        setLearningContext("");
      } finally {
        setLoading(false);
      }
    }
    fetchContext();
  }, []);

  async function handleSendMessage(content: string) {
    const userMsg: Message = { role: "user", content, timestamp: new Date().toISOString() };
    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Build previous messages context
    const allMessages = [...messages, userMsg];
    const previousMessages = allMessages.length > 0
      ? allMessages.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n\n")
      : undefined;

    try {
      const res = await fetch("/api/qna/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          learningContext: learningContext || "",
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
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              accumulated += parsed.content;
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
                return msgs;
              });
            } else if (parsed.type === "done") {
              accumulated = parsed.content || accumulated;
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
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: "응답을 받는데 실패했습니다. 다시 시도해주세요." };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSuggestedQuestion(question: string) {
    handleSendMessage(question);
  }

  if (loading) {
    return (
      <main className="flex-1 flex flex-col">
        <div className="px-6 py-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-32 w-64 rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Q&A</h1>
            <p className="text-xs text-muted-foreground">
              {topicCount > 0
                ? `${topicCount}개 주제의 학습 데이터를 기반으로 답변합니다`
                : "학습 데이터가 없습니다. 먼저 학습을 시작하세요"
              }
            </p>
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col min-h-0">
          {/* Empty state */}
          <div className="flex flex-1 min-h-0 flex-col items-center justify-center px-6 gap-6 overflow-y-auto">
            <div className="text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">무엇이든 물어보세요</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                학습 기록, 테스트 결과, 약점 데이터를 분석하여 답변합니다.
              </p>
            </div>

            {/* Suggested questions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={isStreaming}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input area — pinned to bottom */}
          <div className="shrink-0 border-t border-border bg-background p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); const input = (e.currentTarget.elements.namedItem("qna-input") as HTMLTextAreaElement); const val = input.value.trim(); if (val && !isStreaming) { handleSendMessage(val); input.value = ""; } }}
              className="mx-auto flex max-w-3xl items-end gap-2"
            >
              <textarea
                name="qna-input"
                placeholder="학습에 대해 궁금한 것을 물어보세요..."
                rows={1}
                disabled={isStreaming}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) { e.preventDefault(); const val = e.currentTarget.value.trim(); if (val && !isStreaming) { handleSendMessage(val); e.currentTarget.value = ""; } } }}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <StreamingChat
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
            placeholder="학습에 대해 궁금한 것을 물어보세요..."
          />
        </div>
      )}
    </main>
  );
}
