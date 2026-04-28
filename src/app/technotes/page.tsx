"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, BookOpen, ClipboardCheck, GraduationCap, Tag, ChevronRight } from "lucide-react";
import { useTopicStore } from "@/stores/topicStore";
import type { TechNote } from "@/types/technote";

interface TopicNoteGroup {
  topicId: string;
  topicName: string;
  notes: TechNote[];
}

export default function TechNotesPage() {
  const { topics, fetchTopics } = useTopicStore();
  const [groups, setGroups] = React.useState<TopicNoteGroup[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  React.useEffect(() => {
    if (topics.length === 0) {
      setIsLoading(false);
      return;
    }

    async function loadNotes() {
      setIsLoading(true);
      const results = await Promise.all(
        topics.map(async (topic) => {
          try {
            const res = await fetch(`/api/technotes/${topic.id}`);
            const data = await res.json();
            const notes: TechNote[] = data.success ? data.data.notes : [];
            return { topicId: topic.id, topicName: topic.name, notes };
          } catch {
            return { topicId: topic.id, topicName: topic.name, notes: [] };
          }
        })
      );
      setGroups(results);
      setIsLoading(false);
    }

    loadNotes();
  }, [topics]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  const totalNotes = groups.reduce((sum, g) => sum + g.notes.length, 0);
  const groupsWithNotes = groups.filter((g) => g.notes.length > 0);
  const emptyGroups = groups.filter((g) => g.notes.length === 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">기술 정리</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-[52px]">
          학습한 내용과 테스트를 기술 블로그처럼 정리하여 빠르게 복습하세요.
          {!isLoading && totalNotes > 0 && (
            <span className="ml-2 text-foreground/70">
              · 전체 {totalNotes}개 정리
            </span>
          )}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-muted/30" />
              <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
            </div>
          ))}
        </div>
      )}

      {/* Empty: no topics at all */}
      {!isLoading && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <FileText className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-base font-medium text-muted-foreground mb-1">아직 학습한 주제가 없습니다</p>
          <p className="text-sm text-muted-foreground/70">학습을 시작하면 기술 정리를 작성할 수 있습니다.</p>
        </div>
      )}

      {/* Grouped notes */}
      {!isLoading && groups.length > 0 && (
        <div className="space-y-8">
          {/* Topics with notes */}
          {groupsWithNotes.map((group) => (
            <section key={group.topicId}>
              {/* Topic header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{group.topicName}</h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {group.notes.length}
                  </span>
                </div>
                <Link
                  href={`/technotes/${group.topicId}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  주제 페이지 <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Note list */}
              <div className="space-y-2">
                {group.notes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/technotes/${group.topicId}/${note.id}`}
                    className="group flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:bg-primary/[0.02]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.sourceType === "session" ? (
                          <BookOpen className="size-3.5 text-muted-foreground shrink-0" />
                        ) : note.sourceType === "diagnosis" ? (
                          <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ClipboardCheck className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {note.title}
                        </h3>
                      </div>
                      {note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap ml-5">
                          {note.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              <Tag className="size-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                      {formatDate(note.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Topics with no notes - compact list */}
          {emptyGroups.length > 0 && (
            <section>
              <div className="mb-3 pb-2 border-b border-border">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  아직 정리가 없는 주제 ({emptyGroups.length})
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {emptyGroups.map((group) => (
                  <Link
                    key={group.topicId}
                    href={`/technotes/${group.topicId}`}
                    className="group flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2.5 text-sm transition-all hover:border-primary/30 hover:bg-primary/[0.02]"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground truncate">
                      {group.topicName}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
