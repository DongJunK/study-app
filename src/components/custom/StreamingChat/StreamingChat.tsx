"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { Message } from "@/types/session";

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatContent(content: string): React.ReactNode {
  // Simple markdown-like rendering: code blocks, bold, inline code
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3);
      const firstNewline = code.indexOf("\n");
      const codeContent = firstNewline >= 0 ? code.slice(firstNewline + 1) : code;
      return (
        <pre
          key={i}
          className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm"
        >
          <code>{codeContent}</code>
        </pre>
      );
    }

    // Split by newlines and render paragraphs
    return part.split("\n").map((line, j) => {
      // Bold
      const boldProcessed = line.split(/(\*\*[^*]+\*\*)/g).map((seg, k) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={k}>{seg.slice(2, -2)}</strong>
          );
        }
        // Inline code
        return seg.split(/(`[^`]+`)/g).map((codeSeg, l) => {
          if (codeSeg.startsWith("`") && codeSeg.endsWith("`")) {
            return (
              <code
                key={l}
                className="rounded bg-muted px-1.5 py-0.5 text-sm"
              >
                {codeSeg.slice(1, -1)}
              </code>
            );
          }
          return <React.Fragment key={l}>{codeSeg}</React.Fragment>;
        });
      });

      return (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {boldProcessed}
        </React.Fragment>
      );
    });
  });
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

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSendMessage(trimmed);
    setInput("");
    // Reset textarea height
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
    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, idx) => (
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
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {formatContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming &&
            (messages.length === 0 ||
              messages[messages.length - 1].role !== "assistant") && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background p-4">
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
