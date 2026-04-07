"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/session";

/**
 * Replace ```json ... ``` blocks in assistant messages with
 * extracted feedback text so users see readable content instead of raw JSON.
 */
function stripJsonBlocks(text: string): string {
  return text.replace(/```json\s*\n?([\s\S]*?)```/g, (_match, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr.trim());
      // Skip final/summary blocks entirely
      if (parsed.type === "final") return "";
      // Extract feedback from scoring blocks
      if (parsed.feedback) return parsed.feedback;
    } catch {
      // Not valid JSON, remove the block
    }
    return "";
  }).trim();
}

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StreamingChat({
  messages,
  isStreaming,
  onSendMessage,
  placeholder = "메시지를 입력하세요...",
  disabled = false,
}: StreamingChatProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isComposingRef = React.useRef(false);
  const autoScrollRef = React.useRef(true);
  const prevStreamingRef = React.useRef(false);
  const revealIdxRef = React.useRef(-1);
  const [, forceUpdate] = React.useState(0);

  // Synchronously compute revealIdx before render to avoid flash
  const wasStreaming = prevStreamingRef.current;
  if (wasStreaming && !isStreaming) {
    const visible = messages.filter((m) => m.content.trim() !== "");
    const lastIdx = visible.length - 1;
    if (lastIdx >= 0 && visible[lastIdx].role === "assistant") {
      revealIdxRef.current = lastIdx;
    }
  }
  prevStreamingRef.current = isStreaming;

  // Clear reveal class after animation completes
  React.useEffect(() => {
    if (revealIdxRef.current >= 0 && !isStreaming) {
      const timer = setTimeout(() => {
        revealIdxRef.current = -1;
        forceUpdate((n) => n + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  // Auto-scroll on new messages or streaming content updates
  const lastContent = messages[messages.length - 1]?.content ?? "";
  React.useEffect(() => {
    if (autoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages.length, lastContent]);

  // Scroll when streaming state changes
  React.useEffect(() => {
    if (autoScrollRef.current) {
      scrollToBottom();
    }
  }, [isStreaming]);

  // Detect manual scroll — only disable auto-scroll on upward scroll
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      if (e.deltaY < 0) {
        autoScrollRef.current = false;
      }
    }

    function handleTouchStart(e: TouchEvent) {
      (el as unknown as { _lastTouchY: number })._lastTouchY = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      const lastY = (el as unknown as { _lastTouchY: number })._lastTouchY;
      if (e.touches[0].clientY > lastY) {
        autoScrollRef.current = false;
      }
      (el as unknown as { _lastTouchY: number })._lastTouchY = e.touches[0].clientY;
    }

    function handleScroll() {
      const isAtBottom = el!.scrollHeight - el!.scrollTop - el!.clientHeight < 80;
      if (isAtBottom) {
        autoScrollRef.current = true;
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: true });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    autoScrollRef.current = true;
    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages
            .filter((msg) => msg.content.trim() !== "")
            .filter((msg, idx, arr) => {
              // Hide the last assistant message while streaming (show indicator instead)
              if (!isStreaming) return true;
              if (msg.role !== "assistant") return true;
              if (idx === arr.length - 1) return false;
              return true;
            })
            .map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-card text-foreground border border-border"
                  }`}
                >
                  <div className={`prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed [&_pre]:bg-zinc-800 [&_pre]:text-zinc-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_code]:bg-muted [&_code]:text-foreground [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:rounded-lg [&_table]:overflow-hidden [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-border${idx === revealIdxRef.current ? " reveal-stagger" : ""}`}>
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {stripJsonBlocks(msg.content)}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Shimmer skeleton — shown while streaming */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="w-64 rounded-2xl border border-border bg-card p-4">
                <div className="space-y-2.5">
                  <div className="h-3 w-[75%] animate-shimmer rounded-md bg-gradient-to-r from-border via-muted-foreground/35 to-border bg-[length:200%_100%]" />
                  <div className="h-3 w-[50%] animate-shimmer rounded-md bg-gradient-to-r from-border via-muted-foreground/35 to-border bg-[length:200%_100%] [animation-delay:150ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area — pinned to bottom */}
      <div className="shrink-0 border-t border-border bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder={placeholder}
            disabled={isStreaming || disabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming || disabled}
            className="shrink-0 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
