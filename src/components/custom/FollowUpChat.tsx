"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { Message } from "@/types/session";

interface FollowUpChatProps {
  topicId: string;
  testId: string;
  modelAnswer: string;
  onComplete: () => void;
}

export function FollowUpChat({
  topicId,
  testId,
  modelAnswer,
  onComplete,
}: FollowUpChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/test/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          testId,
          question: trimmed,
          context: modelAnswer,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = res.body.getReader();
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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송합니다. 응답을 가져오는데 실패했습니다.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          후속 Q&A
        </h3>
        <Button variant="outline" size="sm" onClick={onComplete}>
          완료
        </Button>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-4"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/10"
                    : "border border-border bg-card"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {isStreaming &&
            (messages.length === 0 ||
              messages[messages.length - 1].role !== "assistant") && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="추가 질문을 입력하세요..."
          disabled={isStreaming}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
          className="shrink-0 rounded-lg"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
