"use client";

import * as React from "react";
import { StreamingChat } from "@/components/custom/StreamingChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Check } from "lucide-react";
import type { Message } from "@/types/session";
import type { Roadmap } from "@/types/topic";

interface SuggestedItem {
  title: string;
  description?: string;
}

interface RoadmapAddChatProps {
  topicId: string;
  topicName: string;
  roadmap: Roadmap;
  onAddItems: (items: SuggestedItem[]) => void;
  onBack: () => void;
}

export function RoadmapAddChat({ topicId, topicName, roadmap, onAddItems, onBack }: RoadmapAddChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [suggestedItems, setSuggestedItems] = React.useState<SuggestedItem[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<Set<number>>(new Set());

  async function handleSendMessage(content: string) {
    const userMsg: Message = { role: "user", content, timestamp: new Date().toISOString() };
    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const allMessages = [...messages, userMsg];
    const previousMessages = allMessages.map(m => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n\n");

    let accumulated = "";

    try {
      const res = await fetch("/api/roadmap-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName,
          currentRoadmap: roadmap.items.map(i => ({ order: i.order, title: i.title, status: i.status })),
          userMessage: content,
          previousMessages,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
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
              setMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
                return msgs;
              });
            } else if (parsed.type === "done") {
              accumulated = parsed.content || accumulated;
              setMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
                return msgs;
              });
            }
          } catch { /* skip */ }
        }
      }

      // Parse suggested items from response
      const jsonMatch = accumulated.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.suggestedItems && Array.isArray(parsed.suggestedItems)) {
            setSuggestedItems(parsed.suggestedItems);
            setSelectedItems(new Set(parsed.suggestedItems.map((_: SuggestedItem, i: number) => i)));
          }
        } catch { /* skip */ }
      }
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: "응답을 받는데 실패했습니다." };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function toggleItem(index: number) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleAddSelected() {
    const items = suggestedItems.filter((_, i) => selectedItems.has(i));
    if (items.length > 0) onAddItems(items);
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              로드맵으로
            </Button>
            <div>
              <h2 className="text-sm font-semibold">로드맵 항목 추가</h2>
              <p className="text-xs text-muted-foreground">어떤 부분을 학습하고 싶은지 알려주세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested items panel */}
      {suggestedItems.length > 0 && (
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium text-muted-foreground mb-2">추천 항목 (선택하여 추가)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleItem(i)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedItems.has(i)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  {selectedItems.has(i) ? <Check className="size-3" /> : <Plus className="size-3" />}
                  {item.title}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={handleAddSelected} disabled={selectedItems.size === 0} className="gap-1.5">
              <Plus className="size-3.5" />
              선택 항목 추가 ({selectedItems.size}개)
            </Button>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <StreamingChat
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          placeholder="예: 코루틴 에러 핸들링에 대해 더 깊이 배우고 싶어요..."
        />
      </div>
    </div>
  );
}
