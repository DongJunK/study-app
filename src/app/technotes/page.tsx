"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, ArrowRight, Plus } from "lucide-react";
import { useTopicStore } from "@/stores/topicStore";
import type { TechNote } from "@/types/technote";

interface TopicNoteInfo {
  topicId: string;
  topicName: string;
  noteCount: number;
  latestDate: string | null;
}

export default function TechNotesPage() {
  const { topics, fetchTopics } = useTopicStore();
  const [topicNotes, setTopicNotes] = React.useState<TopicNoteInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  React.useEffect(() => {
    if (topics.length === 0) return;

    async function loadNotes() {
      setIsLoading(true);
      const infos: TopicNoteInfo[] = [];

      for (const topic of topics) {
        try {
          const res = await fetch(`/api/technotes/${topic.id}`);
          const data = await res.json();
          if (data.success) {
            const notes: TechNote[] = data.data.notes;
            infos.push({
              topicId: topic.id,
              topicName: topic.name,
              noteCount: notes.length,
              latestDate: notes.length > 0 ? notes[0].createdAt : null,
            });
          }
        } catch {
          infos.push({
            topicId: topic.id,
            topicName: topic.name,
            noteCount: 0,
            latestDate: null,
          });
        }
      }

      setTopicNotes(infos);
      setIsLoading(false);
    }

    loadNotes();
  }, [topics]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

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
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && topicNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <FileText className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-base font-medium text-muted-foreground mb-1">아직 학습한 주제가 없습니다</p>
          <p className="text-sm text-muted-foreground/70">학습을 시작하면 기술 정리를 작성할 수 있습니다.</p>
        </div>
      )}

      {/* Topic cards */}
      {!isLoading && topicNotes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topicNotes.map((info) => (
            <Link
              key={info.topicId}
              href={`/technotes/${info.topicId}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {info.topicName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="size-3.5" />
                    {info.noteCount}개 정리
                  </span>
                  {info.latestDate && (
                    <span>최근 {formatDate(info.latestDate)}</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {info.noteCount === 0 ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Plus className="size-3.5" />
                    정리 시작하기
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">정리 보기</span>
                )}
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
