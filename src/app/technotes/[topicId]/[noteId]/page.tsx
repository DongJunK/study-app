"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Tag, BookOpen, ClipboardCheck, Loader2, Trash2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TechNote } from "@/types/technote";

const mdComponents = {
  p: ({ children, ...props }: React.ComponentProps<"p">) => <p className="text-[15px] leading-relaxed mb-3" {...props}>{children}</p>,
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props}>{children}</ul>,
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props}>{children}</ol>,
  li: ({ children, ...props }: React.ComponentProps<"li">) => <li className="text-[15px] leading-relaxed" {...props}>{children}</li>,
  strong: ({ children, ...props }: React.ComponentProps<"strong">) => <strong className="font-semibold text-foreground" {...props}>{children}</strong>,
  code: ({ children, ...props }: React.ComponentProps<"code">) => <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground" {...props}>{children}</code>,
  pre: ({ children, ...props }: React.ComponentProps<"pre">) => <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-800 text-zinc-100 p-4 text-sm font-mono overflow-x-auto mb-4" {...props}>{children}</pre>,
  h1: ({ children, ...props }: React.ComponentProps<"h1">) => <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground" {...props}>{children}</h1>,
  h2: ({ children, ...props }: React.ComponentProps<"h2">) => <h2 className="text-xl font-semibold mb-3 mt-6 pb-2 border-b border-border text-foreground" {...props}>{children}</h2>,
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground" {...props}>{children}</h3>,
  blockquote: ({ children, ...props }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-4 border-primary/40 pl-4 py-1 italic text-muted-foreground my-4 bg-primary/5 rounded-r-lg pr-4" {...props}>{children}</blockquote>,
  table: ({ children, ...props }: React.ComponentProps<"table">) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse border border-border text-sm" {...props}>{children}</table></div>,
  th: ({ children, ...props }: React.ComponentProps<"th">) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props}>{children}</th>,
  td: ({ children, ...props }: React.ComponentProps<"td">) => <td className="border border-border px-3 py-2" {...props}>{children}</td>,
  hr: ({ ...props }: React.ComponentProps<"hr">) => <hr className="my-6 border-border" {...props} />,
};

export default function TechNoteDetailPage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const noteId = params.noteId as string;

  const [note, setNote] = React.useState<TechNote | null>(null);
  const [content, setContent] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/technotes/${topicId}/${noteId}`);
        const data = await res.json();
        if (data.success) {
          setNote(data.data.note);
          setContent(data.data.content);
        }
      } catch { /* ignore */ }
      setIsLoading(false);
    }
    load();
  }, [topicId, noteId]);

  async function handleDelete() {
    if (!confirm("이 기술 정리를 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/technotes/${topicId}/${noteId}`, { method: "DELETE" });
      window.location.href = `/technotes/${topicId}`;
    } catch { /* ignore */ }
    setIsDeleting(false);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!note || !content) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-center text-muted-foreground py-20">기술 정리를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Navigation */}
      <Link
        href={`/technotes/${topicId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        목록으로
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-3">{note.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {note.sourceType === "session" ? <BookOpen className="size-3" /> : note.sourceType === "diagnosis" ? <GraduationCap className="size-3" /> : <ClipboardCheck className="size-3" />}
            {note.sourceType === "session" ? "학습 기반" : note.sourceType === "diagnosis" ? "수준진단 기반" : "테스트 기반"}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
          {note.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {note.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Markdown content */}
      <article className="rounded-2xl border border-border bg-card px-10 py-10">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-red-500 gap-1.5"
        >
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          삭제
        </Button>
      </div>
    </div>
  );
}
