"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileText, Tag, BookOpen, ClipboardCheck, Loader2, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TechNote, NoteSource } from "@/types/technote";
import type { Topic } from "@/types/topic";

type Phase = "list" | "sources" | "preview" | "generating";

const mdPreviewComponents = {
  p: ({ children, ...props }: React.ComponentProps<"p">) => <p className="text-sm leading-relaxed mb-2" {...props}>{children}</p>,
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
  li: ({ children, ...props }: React.ComponentProps<"li">) => <li className="text-sm" {...props}>{children}</li>,
  strong: ({ children, ...props }: React.ComponentProps<"strong">) => <strong className="font-semibold" {...props}>{children}</strong>,
  code: ({ children, ...props }: React.ComponentProps<"code">) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>,
  pre: ({ children, ...props }: React.ComponentProps<"pre">) => <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto mb-3" {...props}>{children}</pre>,
  h1: ({ children, ...props }: React.ComponentProps<"h1">) => <h1 className="text-xl font-bold mb-3 mt-4" {...props}>{children}</h1>,
  h2: ({ children, ...props }: React.ComponentProps<"h2">) => <h2 className="text-lg font-semibold mb-2 mt-3" {...props}>{children}</h2>,
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => <h3 className="text-base font-semibold mb-1.5 mt-2" {...props}>{children}</h3>,
  blockquote: ({ children, ...props }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3" {...props}>{children}</blockquote>,
  table: ({ children, ...props }: React.ComponentProps<"table">) => <table className="w-full border-collapse border border-border text-sm my-3" {...props}>{children}</table>,
  th: ({ children, ...props }: React.ComponentProps<"th">) => <th className="border border-border bg-muted px-3 py-1.5 text-left font-medium" {...props}>{children}</th>,
  td: ({ children, ...props }: React.ComponentProps<"td">) => <td className="border border-border px-3 py-1.5" {...props}>{children}</td>,
};

function extractMetaFromMarkdown(md: string): { title: string; tags: string[]; cleanMarkdown: string } {
  const jsonMatch = md.match(/```json\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```\s*$/);
  let title = "기술 정리";
  let tags: string[] = [];
  let cleanMarkdown = md;

  if (jsonMatch) {
    try {
      const meta = JSON.parse(jsonMatch[1]);
      title = meta.title || title;
      tags = meta.tags || tags;
      cleanMarkdown = md.slice(0, jsonMatch.index).replace(/---\s*$/, "").trim();
    } catch { /* parse failed, use defaults */ }
  }

  // Fallback: extract title from first h1
  if (title === "기술 정리") {
    const h1Match = cleanMarkdown.match(/^#\s+(.+)$/m);
    if (h1Match) title = h1Match[1];
  }

  return { title, tags, cleanMarkdown };
}

export default function TopicTechNotesPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const [phase, setPhase] = React.useState<Phase>("list");
  const [notes, setNotes] = React.useState<TechNote[]>([]);
  const [topic, setTopic] = React.useState<Topic | null>(null);
  const [sources, setSources] = React.useState<NoteSource[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingSources, setIsLoadingSources] = React.useState(false);

  // Streaming generation state
  const [generatingMarkdown, setGeneratingMarkdown] = React.useState("");
  const [selectedSource, setSelectedSource] = React.useState<NoteSource | null>(null);
  const [sourcePreview, setSourcePreview] = React.useState<Record<string, unknown> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchNotes = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/technotes/${topicId}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data.notes);
        setTopic(data.data.topic);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [topicId]);

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleOpenSources() {
    setPhase("sources");
    setIsLoadingSources(true);
    try {
      const res = await fetch(`/api/technotes/${topicId}/sources`);
      const data = await res.json();
      if (data.success) setSources(data.data);
    } catch { /* ignore */ }
    setIsLoadingSources(false);
  }

  async function handleSelectSource(source: NoteSource) {
    setSelectedSource(source);
    setSourcePreview(null);
    setPhase("preview");
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/technotes/${topicId}/sources/${source.sourceId}?type=${source.sourceType}`);
      const data = await res.json();
      if (data.success) setSourcePreview(data.data);
    } catch { /* ignore */ }
    setIsLoadingPreview(false);
  }

  async function handleStartGenerate() {
    if (!selectedSource) return;
    setPhase("generating");
    setGeneratingMarkdown("");

    try {
      const res = await fetch(`/api/technotes/${topicId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: selectedSource.sourceType, sourceId: selectedSource.sourceId }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const event = JSON.parse(payload);
            if (event.type === "text") {
              fullText += event.content;
              setGeneratingMarkdown(fullText);
            } else if (event.type === "done") {
              fullText = event.content;
              setGeneratingMarkdown(fullText);
            }
          } catch { /* skip */ }
        }
      }

      // Auto-save after generation
      await saveNote(fullText, selectedSource);
    } catch {
      // error handling
    }
  }

  async function saveNote(markdown: string, source: NoteSource) {
    setIsSaving(true);
    const { title, tags, cleanMarkdown } = extractMetaFromMarkdown(markdown);
    const noteId = crypto.randomUUID();

    try {
      const res = await fetch(`/api/technotes/${topicId}/${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: cleanMarkdown,
          title,
          tags,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
        }),
      });

      if (res.ok) {
        await fetchNotes();
        setPhase("list");
        setGeneratingMarkdown("");
        setSelectedSource(null);
      }
    } catch { /* ignore */ }
    setIsSaving(false);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
  <>
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <Link href="/technotes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="size-4" />
          전체 주제
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{topic?.name || "..."}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{notes.length}개 기술 정리</p>
          </div>
          {phase === "list" && (
            <Button onClick={handleOpenSources} className="gap-1.5">
              <Plus className="size-4" />
              추가하기
            </Button>
          )}
          {phase !== "list" && (
            <Button
              variant="outline"
              onClick={() => { setPhase("list"); setGeneratingMarkdown(""); setSelectedSource(null); }}
              className="gap-1.5"
            >
              <X className="size-4" />
              취소
            </Button>
          )}
        </div>
      </div>

      {/* Phase: List */}
      {phase === "list" && (
        <>
          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/30" />
              ))}
            </div>
          )}

          {!isLoading && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-24 px-8">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-5">
                <FileText className="size-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground mb-2">아직 기술 정리가 없습니다</p>
              <p className="text-sm text-muted-foreground/70">상단의 추가하기 버튼을 눌러 학습 내용을 정리해보세요.</p>
            </div>
          )}

          {!isLoading && notes.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/technotes/${topicId}/${note.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 min-h-[160px]"
                >
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2 leading-snug">
                      {note.title}
                    </h3>
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <Tag className="size-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50 mt-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {note.sourceType === "session" ? <BookOpen className="size-3.5" /> : note.sourceType === "diagnosis" ? <GraduationCap className="size-3.5" /> : <ClipboardCheck className="size-3.5" />}
                      {note.sourceType === "session" ? "학습" : note.sourceType === "diagnosis" ? "수준진단" : "테스트"}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Phase: Sources selection */}
      {phase === "sources" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">정리할 내용 선택</h2>
          <p className="text-sm text-muted-foreground mb-6">아직 기술 정리로 작성하지 않은 학습/테스트 내용입니다.</p>
          {isLoadingSources && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingSources && sources.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-20">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <FileText className="size-7 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium text-muted-foreground mb-1">추가할 수 있는 내용이 없습니다</p>
              <p className="text-sm text-muted-foreground/70">모든 학습/테스트 내용이 이미 정리되었습니다.</p>
            </div>
          )}

          {!isLoadingSources && sources.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sources.map((source) => (
                <button
                  key={source.sourceId}
                  onClick={() => handleSelectSource(source)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {source.sourceType === "session" ? (
                      <BookOpen className="size-4 text-muted-foreground" />
                    ) : source.sourceType === "diagnosis" ? (
                      <GraduationCap className="size-4 text-muted-foreground" />
                    ) : (
                      <ClipboardCheck className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{source.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {source.sourceType === "session" ? "학습 세션" : source.sourceType === "diagnosis" ? "수준진단" : "테스트"} · {formatDate(source.date)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase: Generating */}
      {phase === "generating" && (
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-base font-medium text-primary">
              {isSaving ? "저장 중..." : "기술 정리 생성 중..."}
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card px-10 py-8 min-h-[400px]">
            {generatingMarkdown ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdPreviewComponents}>
                  {generatingMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="size-10 animate-spin text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground/60">AI가 내용을 분석하고 있습니다...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Preview popup - rendered outside main container for proper overflow */}
    {phase === "preview" && selectedSource && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ overflow: "auto" }}>
        <div className="m-4 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: "calc(100vh - 4rem)", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="px-7 pt-7 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {selectedSource.sourceType === "session" ? (
                  <BookOpen className="size-4 text-primary" />
                ) : selectedSource.sourceType === "diagnosis" ? (
                  <GraduationCap className="size-4 text-primary" />
                ) : (
                  <ClipboardCheck className="size-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {selectedSource.sourceType === "session" ? "학습 세션" : selectedSource.sourceType === "diagnosis" ? "수준진단" : "테스트 결과"} · {formatDate(selectedSource.date)}
                </p>
                <p className="text-base font-bold text-foreground">{selectedSource.title}</p>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="px-7 pb-2 flex-shrink flex-grow overflow-y-auto" style={{ minHeight: 0 }}>
            {isLoadingPreview && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoadingPreview && sourcePreview && selectedSource.sourceType === "diagnosis" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {(sourcePreview as { level: string }).level}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{(sourcePreview as { summary: string }).summary}</p>
                </div>
                {((sourcePreview as { strengths: string[] }).strengths || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">강점</p>
                    <div className="space-y-1.5">
                      {(sourcePreview as { strengths: string[] }).strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2.5">
                          <span className="text-green-500 mt-0.5 text-xs">✓</span>
                          <p className="text-sm text-foreground/80 leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {((sourcePreview as { weaknesses: string[] }).weaknesses || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 mb-2">약점</p>
                    <div className="space-y-1.5">
                      {(sourcePreview as { weaknesses: string[] }).weaknesses.map((w: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5">
                          <span className="text-red-500 mt-0.5 text-xs">!</span>
                          <p className="text-sm text-foreground/80 leading-relaxed">{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {((sourcePreview as { highlights: string[] }).highlights || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">진단 대화 미리보기</p>
                    <div className="space-y-2">
                      {((sourcePreview as { highlights: string[] }).highlights).map((h: string, i: number) => (
                        <div key={i} className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                          <p className="text-sm text-foreground/80 leading-relaxed">{h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoadingPreview && sourcePreview && selectedSource.sourceType === "session" && (
              <div className="space-y-4">
                {(sourcePreview as { summary?: string }).summary && (
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">학습 요약</p>
                    <p className="text-sm text-foreground leading-relaxed">{(sourcePreview as { summary: string }).summary}</p>
                  </div>
                )}
                {((sourcePreview as { userQuestions?: string[] }).userQuestions || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">다룬 질문</p>
                    <div className="space-y-1.5">
                      {((sourcePreview as { userQuestions: string[] }).userQuestions).map((q: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                          <span className="text-xs font-bold text-primary mt-0.5">Q{i + 1}</span>
                          <p className="text-sm text-foreground/80 leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    학습 내용 미리보기 ({(sourcePreview as { messageCount: number }).messageCount}개 메시지)
                  </p>
                  <div className="space-y-2">
                    {((sourcePreview as { highlights: string[] }).highlights || []).map((h: string, i: number) => (
                      <div key={i} className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                        <p className="text-sm text-foreground/80 leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isLoadingPreview && sourcePreview && selectedSource.sourceType === "test" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    {(sourcePreview as { testType: string }).testType}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(sourcePreview as { totalScore: number }).totalScore}/{(sourcePreview as { maxTotalScore: number }).maxTotalScore}점
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${(sourcePreview as { passed: boolean }).passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                    {(sourcePreview as { passed: boolean }).passed ? "통과" : "미달"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">출제 문제</p>
                  <div className="space-y-1.5">
                    {((sourcePreview as { questions: Array<{ question: string; passed: boolean; score: number; maxScore: number }> }).questions || []).map((q, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${q.passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground/80 leading-relaxed flex-1">{q.question}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{q.score}/{q.maxScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-7 pt-5 pb-7 justify-end border-t border-border/50 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => { setPhase("sources"); setSelectedSource(null); setSourcePreview(null); }}
            >
              취소
            </Button>
            <Button onClick={handleStartGenerate} className="gap-1.5" disabled={isLoadingPreview}>
              <FileText className="size-4" />
              생성 시작
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
