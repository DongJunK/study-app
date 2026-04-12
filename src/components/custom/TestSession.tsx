"use client";

import * as React from "react";
import { StreamingChat } from "@/components/custom/StreamingChat";
import { useTestStore } from "@/stores/testStore";
import type { Message } from "@/types/session";
import type { TestType, TestAnswer } from "@/types/test";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestSessionProps {
  topicId: string;
  topicName: string;
  type: TestType;
  strategic?: boolean;
  onComplete: (answers: TestAnswer[]) => void;
}

export function TestSession({
  topicId,
  topicName,
  type,
  strategic = false,
  onComplete,
}: TestSessionProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [isStarted, setIsStarted] = React.useState(false);
  const [testFinished, setTestFinished] = React.useState(false);
  const questionCountRef = React.useRef(0);
  const messagesRef = React.useRef<Message[]>([]);

  // Keep messagesRef in sync
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const { currentTest, addAnswer } = useTestStore();

  const answers = currentTest?.answers ?? [];

  // Timer count-up
  React.useEffect(() => {
    if (!isStarted || testFinished) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, testFinished]);

  // Start test - fetch initial question
  React.useEffect(() => {
    if (isStarted) return;
    setIsStarted(true);
    startTestStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startTestStream() {
    setIsStreaming(true);
    try {
      const res = await fetch("/api/test/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topicName,
          type,
          concepts: [],
          strategic,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages([assistantMsg]);

      await processStream(res.body, "");
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "테스트를 시작하는데 실패했습니다. 다시 시도해주세요.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function processStream(body: ReadableStream<Uint8Array>, _prefix: string) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let accumulated = _prefix;

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

    // After stream ends, check for score JSON in the response
    parseScoreFromResponse(accumulated);
  }

  function parseScoreFromResponse(text: string) {
    const jsonMatches = text.match(/```json\s*\n?([\s\S]*?)```/g);
    if (!jsonMatches) return;

    for (const match of jsonMatches) {
      const jsonStr = match.replace(/```json\s*\n?/, "").replace(/```/, "").trim();
      try {
        const parsed = JSON.parse(jsonStr);

        // Check for final summary
        if (parsed.type === "final") {
          // Multiple-choice: bulk scoring from results array
          // Only add answers from final block if no real-time answers exist (multiple-choice)
          if (Array.isArray(parsed.results) && questionCountRef.current === 0) {
            for (const r of parsed.results) {
              questionCountRef.current += 1;
              const answer: TestAnswer = {
                questionIndex: r.questionIndex || questionCountRef.current,
                question: r.question || "",
                userAnswer: r.userAnswer || "",
                modelAnswer: r.correctAnswer || "",
                score: r.score ?? (r.correct ? 10 : 0),
                maxScore: r.maxScore ?? 10,
                passed: (r.score ?? 0) / (r.maxScore ?? 10) >= 0.7,
                feedback: r.feedback || "",
              };
              addAnswer(answer);
            }
          }
          setTestFinished(true);
          return;
        }

        // Real-time scoring for deep-learning / short-answer (not multiple-choice)
        if (type !== "multiple-choice" && typeof parsed.score === "number" && typeof parsed.maxScore === "number") {
          questionCountRef.current += 1;

          // Extract question and user answer from recent chat messages
          const msgs = messagesRef.current;
          let lastQuestion = parsed.question || "";
          let lastUserAnswer = parsed.userAnswer || "";

          if (!lastQuestion || !lastUserAnswer) {
            // Walk backwards: the most recent user message is the answer,
            // the assistant message before it contains the question
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (!lastUserAnswer && msgs[i].role === "user") {
                lastUserAnswer = msgs[i].content;
              } else if (lastUserAnswer && !lastQuestion && msgs[i].role === "assistant") {
                // Strip JSON blocks from assistant message to get clean question text
                lastQuestion = msgs[i].content
                  .replace(/```json\s*\n?[\s\S]*?```/g, "")
                  .trim();
                break;
              }
            }
          }

          const answer: TestAnswer = {
            questionIndex: questionCountRef.current,
            question: lastQuestion,
            userAnswer: lastUserAnswer,
            modelAnswer: parsed.modelAnswer || parsed.correctAnswer || "",
            score: parsed.score,
            maxScore: parsed.maxScore,
            passed: parsed.score / parsed.maxScore >= 0.7,
            feedback: parsed.feedback || "",
          };
          addAnswer(answer);
        }
      } catch {
        // skip invalid JSON
      }
    }
  }

  async function handleSendMessage(content: string) {
    if (testFinished) return;

    const userMsg: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // Send user answer to the streaming chat with conversation context
      const conversationContext = messages
        .map((m) => `${m.role === "user" ? "학생" : "시험관"}: ${m.content}`)
        .join("\n\n");

      const res = await fetch("/api/claude/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `이전 대화:\n${conversationContext}\n\n학생: ${content}`,
          systemPrompt: getSystemPromptForType(type, topicName),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await processStream(res.body, "");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "응답을 가져오는데 실패했습니다.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header with timer */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {topicName} - {getTypeLabel(type)}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-medium bg-muted text-foreground">
            <Clock className="size-3.5" />
            {formatTime(elapsed)}
          </div>
          {type !== "multiple-choice" && (
            <span className="text-xs text-muted-foreground">
              {answers.length}/10 문제
            </span>
          )}
          {testFinished ? (
            <Button size="sm" onClick={() => onComplete(answers)}>
              결과 보기
            </Button>
          ) : type === "multiple-choice" ? (
            <span className="text-xs text-muted-foreground">퀴즈 진행 중</span>
          ) : (
            <Button
              size="sm"
              variant={answers.length >= 10 ? "default" : "outline"}
              onClick={() => {
                if (answers.length >= 10) {
                  setTestFinished(true);
                }
              }}
              disabled={answers.length < 10 || isStreaming}
              title={answers.length < 10 ? `최소 10문제 이상 답변해야 합니다 (현재 ${answers.length}문제)` : ""}
            >
              테스트 종료
            </Button>
          )}
        </div>
      </div>



      {/* Chat area */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <StreamingChat
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          placeholder={testFinished ? "테스트가 종료되었습니다" : "답변을 입력하세요..."}
          disabled={testFinished}
        />
      </div>

      {/* Completion banner */}
      {testFinished && (
        <div className="shrink-0 border-t border-border bg-primary/5 px-4 py-4">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <p className="text-sm font-medium">테스트가 완료되었습니다. 마지막 피드백을 확인한 후 결과를 확인하세요.</p>
            <Button onClick={() => onComplete(answers)} className="gap-1.5">
              <CheckCircle className="size-4" />
              결과 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type: TestType): string {
  switch (type) {
    case "deep-learning":
      return "깊은 학습 시뮬레이션";
    case "multiple-choice":
      return "객관식 퀴즈";
    case "short-answer":
      return "주관식 퀴즈";
  }
}

function getSystemPromptForType(type: TestType, topicName: string): string {
  switch (type) {
    case "deep-learning":
      return `당신은 "${topicName}" 분야의 심층 학습 검증 전문가입니다. 이전 대화를 이어서 진행하세요. 학생의 답변을 평가하고 점수를 매긴 뒤, 꼬리질문을 계속하세요. 각 답변 평가 후 반드시 \`\`\`json {"score": N, "maxScore": 10, "passed": true/false, "feedback": "피드백", "modelAnswer": "이 질문에 대한 모범 답변"} \`\`\` 형식의 JSON을 포함하세요. modelAnswer는 6년차 개발자 수준의 모범 답변을 간결하게 작성하세요. 모든 질문이 끝나면 \`\`\`json {"type": "final", "totalQuestions": N, "summary": "종합 평가"} \`\`\` 를 포함하세요. 한국어로 진행하세요.`;
    case "multiple-choice":
      return `당신은 "${topicName}" 분야의 객관식 퀴즈 출제 전문가입니다. 이전 대화를 이어서 진행하세요. 학생의 답을 채점하고 다음 문제를 출제하세요. 정답: \`\`\`json {"score": 10, "maxScore": 10, "passed": true, "feedback": "해설"} \`\`\`, 오답: \`\`\`json {"score": 0, "maxScore": 10, "passed": false, "feedback": "해설"} \`\`\`. 모든 문제 후: \`\`\`json {"type": "final", "totalQuestions": 5, "summary": "종합 평가"} \`\`\`. 한국어로 진행하세요.`;
    case "short-answer":
      return `당신은 "${topicName}" 분야의 주관식 퀴즈 출제 전문가입니다. 이전 대화를 이어서 진행하세요. 학생의 답변을 1-10점 척도로 채점하세요. \`\`\`json {"score": N, "maxScore": 10, "passed": true/false, "feedback": "피드백", "modelAnswer": "이 질문에 대한 모범 답변"} \`\`\`. modelAnswer는 핵심을 간결하게 작성하세요. 모든 문제 후: \`\`\`json {"type": "final", "totalQuestions": 5, "summary": "종합 평가"} \`\`\`. 한국어로 진행하세요.`;
  }
}
