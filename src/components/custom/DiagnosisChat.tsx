"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { StreamingChat } from "@/components/custom/StreamingChat";
import { useSessionStore } from "@/stores/sessionStore";
import type { Message } from "@/types/session";
import { RotateCcw, CheckCircle } from "lucide-react";
import { DiagnosisResult } from "@/components/custom/DiagnosisResult";

interface DiagnosisChatProps {
  topicId: string;
  topicName: string;
  onDiagnosisComplete: (result: string, additionalTopics?: string[]) => void;
}

export function DiagnosisChat({
  topicId,
  topicName,
  onDiagnosisComplete,
}: DiagnosisChatProps) {
  const {
    messages,
    isStreaming,
    diagnosisComplete,
    diagnosisResult,
    addMessage,
    updateLastAssistantMessage,
    setStreaming,
    setDiagnosisComplete,
    setDiagnosisResult,
    clearMessages,
  } = useSessionStore();

  const hasStarted = React.useRef(false);
  const questionCount = React.useRef(0);

  async function saveSession(
    currentMessages: Message[],
    isComplete: boolean,
    result: string | null
  ) {
    try {
      await fetch(`/api/topics/${topicId}/diagnosis/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, isComplete, result }),
      });
    } catch {
      // Silently ignore
    }
  }

  React.useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function initDiagnosis() {
      try {
        const res = await fetch(`/api/topics/${topicId}/diagnosis/session`);
        const json = await res.json();

        if (json.success && json.data) {
          const saved = json.data;

          if (saved.isComplete && saved.result) {
            onDiagnosisComplete(saved.result);
            return;
          }

          if (saved.messages && saved.messages.length > 0) {
            clearMessages();
            for (const msg of saved.messages) {
              addMessage(msg);
            }

            // Count existing questions for context
            questionCount.current = saved.messages.filter(
              (m: Message) => m.role === "user"
            ).length;

            const lastMessage = saved.messages[saved.messages.length - 1];

            if (lastMessage.role === "user") {
              // Claude hasn't responded yet - send just the last user answer
              setStreaming(true);
              try {
                const response = await fetch(`/api/claude/stream`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    prompt: lastMessage.content,
                    systemPrompt: getDiagnosisSystemPrompt(
                      topicName,
                      buildConversationHistory(saved.messages)
                    ),
                  }),
                });
                await processStream(response);
              } catch {
                addMessage({
                  role: "assistant",
                  content: "진단을 재개하는데 문제가 발생했습니다.",
                  timestamp: new Date().toISOString(),
                });
              } finally {
                setStreaming(false);
              }
            }
            // If last message was from assistant, just wait for user
            return;
          }
        }
      } catch {
        // Fall through to fresh start
      }

      await startDiagnosis();
    }

    initDiagnosis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startDiagnosis() {
    clearMessages();
    questionCount.current = 0;
    setDiagnosisComplete(false);
    setDiagnosisResult(null);
    setStreaming(true);

    addMessage({
      role: "system",
      content: `"${topicName}" 주제에 대한 수준 진단을 시작합니다.`,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(`/api/claude/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `"${topicName}" 주제에 대한 수준 진단을 시작해주세요. 첫 번째 질문 하나만 해주세요.`,
          systemPrompt: getDiagnosisSystemPrompt(topicName, ""),
        }),
      });
      await processStream(response);
    } catch {
      addMessage({
        role: "assistant",
        content: "진단을 시작하는데 문제가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setStreaming(false);
    }
  }

  async function handleRestart() {
    // Delete saved session
    try {
      await fetch(`/api/topics/${topicId}/diagnosis/session`, { method: "DELETE" });
    } catch {
      // Ignore
    }
    hasStarted.current = false;
    await startDiagnosis();
  }

  async function handleSendMessage(content: string) {
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    questionCount.current += 1;

    // Save after user message
    const stateAfterUser = useSessionStore.getState();
    await saveSession(
      stateAfterUser.messages,
      stateAfterUser.diagnosisComplete,
      stateAfterUser.diagnosisResult
    );

    setStreaming(true);

    try {
      // Build conversation history for system prompt context
      const currentMessages = useSessionStore.getState().messages;
      const history = buildConversationHistory(currentMessages);

      // Send ONLY the user's latest answer as the prompt
      // The conversation history goes into the system prompt
      const response = await fetch(`/api/claude/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          systemPrompt: getDiagnosisSystemPrompt(topicName, history),
        }),
      });

      await processStream(response);
    } catch {
      addMessage({
        role: "assistant",
        content: "응답을 받는데 문제가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setStreaming(false);
    }
  }

  async function processStream(response: Response) {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let messageAdded = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "text") {
              fullContent += parsed.content || "";
              if (!messageAdded) {
                addMessage({
                  role: "assistant",
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                });
                messageAdded = true;
              } else {
                updateLastAssistantMessage(fullContent);
              }
            } else if (parsed.type === "done") {
              fullContent = parsed.content || fullContent;
              if (!messageAdded) {
                addMessage({
                  role: "assistant",
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                });
                messageAdded = true;
              } else {
                updateLastAssistantMessage(fullContent);
              }
            }
          } catch {
            // Skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Check for diagnosis completion
    let isComplete = false;
    let result: string | null = null;

    const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.level && parsed.strengths && parsed.weaknesses) {
          isComplete = true;
          result = JSON.stringify(parsed);
          // Don't set diagnosisComplete yet — let user review last feedback first
          setDiagnosisResult(result);
        }
      } catch {
        // Not valid JSON
      }
    }

    // Save after AI response
    const currentState = useSessionStore.getState();
    await saveSession(
      currentState.messages,
      isComplete || currentState.diagnosisComplete,
      result ?? currentState.diagnosisResult
    );
  }

  function handleGenerateRoadmap(additionalTopics: string[] = []) {
    if (diagnosisResult) {
      fetch(`/api/topics/${topicId}/diagnosis/session`, { method: "DELETE" }).catch(() => {});
      onDiagnosisComplete(diagnosisResult, additionalTopics);
    }
  }

  if (diagnosisComplete && diagnosisResult) {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
        <DiagnosisResult
          result={diagnosisResult}
          topicName={topicName}
          onGenerateRoadmap={(additionalTopics) => handleGenerateRoadmap(additionalTopics)}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  const hasResult = !!diagnosisResult && !diagnosisComplete;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">수준 진단</h2>
            <p className="text-sm text-muted-foreground">
              {topicName} - AI가 현재 수준을 파악합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasResult && (
              <Button
                size="sm"
                onClick={() => setDiagnosisComplete(true)}
                className="gap-1.5"
              >
                <CheckCircle className="size-3.5" />
                진단 결과 보기
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={isStreaming}
              className="gap-2"
            >
              <RotateCcw className="size-3.5" />
              다시하기
            </Button>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <StreamingChat
          messages={messages.filter((m) => m.role !== "system")}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          placeholder="답변을 입력하세요..."
          disabled={hasResult}
        />
      </div>

      {/* Completion banner */}
      {hasResult && (
        <div className="shrink-0 border-t border-border bg-primary/5 px-4 py-4">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <p className="text-sm font-medium">진단이 완료되었습니다. 마지막 피드백을 확인한 후 결과를 확인하세요.</p>
            <Button onClick={() => setDiagnosisComplete(true)} className="gap-1.5">
              <CheckCircle className="size-4" />
              결과 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildConversationHistory(messages: Message[]): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (m.role === "user") return `<user_answer>${m.content}</user_answer>`;
      return `<your_previous_question>${m.content}</your_previous_question>`;
    })
    .join("\n");
}

function getDiagnosisSystemPrompt(topicName: string, conversationHistory: string): string {
  const historySection = conversationHistory
    ? `\n\n<conversation_so_far>\n${conversationHistory}\n</conversation_so_far>\n\nContinue from where you left off. The user just answered your last question. Evaluate their answer briefly, then ask the NEXT question.`
    : "";

  return `You are a technical skills assessor for "${topicName}".

CRITICAL RULES:
1. You must ask exactly ONE question per response. Never ask multiple questions.
2. NEVER write or simulate the user's answer. You only write YOUR part.
3. NEVER generate text like "User:" or pretend to be the user.
4. After evaluating the user's answer, ask the next question and STOP.
5. Ask 5-7 questions total, progressively harder.
6. All text must be in Korean.
7. Be encouraging, not judgmental.

RESPONSE FORMAT for each turn:
- Brief evaluation of the user's previous answer (1-2 sentences, encouraging)
- Then ask the next question (clearly numbered, e.g. Q3.)
- STOP after the question. Do not continue.

After all 5-7 questions are answered, provide ONLY a summary in this JSON format:
\`\`\`json
{
  "level": "beginner" | "intermediate" | "advanced",
  "strengths": ["strong areas in Korean"],
  "weaknesses": ["weak areas in Korean"],
  "summary": "Brief assessment in Korean"
}
\`\`\`
${historySection}`;
}
