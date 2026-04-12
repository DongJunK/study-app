"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mb-2 last:mb-0" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-2 list-disc pl-5 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-2 list-decimal pl-5 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
    <li className="text-sm" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>
    ) : (
      <code className={`${className} text-xs font-mono`} {...props}>{children}</code>
    );
  },
  pre: ({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs" {...props}>{children}</pre>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mb-1 text-sm font-semibold" {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
    <h4 className="mb-1 text-sm font-medium" {...props}>{children}</h4>
  ),
};

interface AnswerComparisonProps {
  userAnswer: string;
  modelAnswer: string;
  gaps: string[];
  feedback: string;
  onFollowUp: (question: string) => void;
}

export function AnswerComparison({
  userAnswer,
  modelAnswer,
  gaps,
  feedback,
  onFollowUp,
}: AnswerComparisonProps) {
  const [question, setQuestion] = React.useState("");

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onFollowUp(trimmed);
    setQuestion("");
  }

  return (
    <div className="space-y-6">
      {/* Two-column comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User answer */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            내 답변
          </h3>
          <div className="text-sm leading-relaxed prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{userAnswer}</ReactMarkdown>
          </div>
        </div>

        {/* Model answer */}
        <div className="rounded-xl border-2 border-primary/30 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-primary">
            모범답안
          </h3>
          <div className="text-sm leading-relaxed prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{modelAnswer}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Gap analysis */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            당신의 답변에서 빠진 핵심 포인트
          </h3>
          <ul className="space-y-2">
            {gaps.map((gap, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="rounded-xl border border-border bg-muted/50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            종합 피드백
          </h3>
          <div className="text-sm leading-relaxed prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{feedback}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Follow-up question input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          모범답안에 대해 궁금한 점이 있나요?
        </h3>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="모범답안에 대해 질문하세요..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim()}
            className="shrink-0 rounded-lg"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
