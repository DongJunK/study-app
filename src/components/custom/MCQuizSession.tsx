"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TestAnswer } from "@/types/test";

interface MCQuestion {
  index: number;
  question: string;
  choices: string[];
  correctIndex: number;
  feedback: string;
}

interface MCQuizSessionProps {
  topicId: string;
  topicName: string;
  strategic: boolean;
  onComplete: (answers: TestAnswer[]) => void;
}

export function MCQuizSession({ topicId, topicName, strategic, onComplete }: MCQuizSessionProps) {
  const [questions, setQuestions] = React.useState<MCQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [slideDirection, setSlideDirection] = React.useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Fetch questions
  React.useEffect(() => {
    async function generate() {
      try {
        const res = await fetch("/api/test/mc-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, topicName, strategic }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setQuestions(json.data);
        } else {
          setError(json.error?.message || "문제 생성에 실패했습니다.");
        }
      } catch {
        setError("문제 생성 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [topicId, topicName, strategic]);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  function goTo(index: number) {
    if (index < 0 || index >= totalQuestions || isAnimating) return;
    setSlideDirection(index > currentIndex ? "left" : "right");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setSlideDirection(null);
      setIsAnimating(false);
    }, 250);
  }

  function handleSelect(choiceIndex: number) {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: choiceIndex }));
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => goTo(currentIndex + 1), 400);
    }
  }

  function handleSubmit() {
    const answers: TestAnswer[] = questions.map((q, i) => {
      const userChoice = selectedAnswers[i];
      const correct = userChoice === q.correctIndex;
      return {
        questionIndex: i + 1,
        question: q.question,
        userAnswer: userChoice !== undefined ? `${userChoice + 1}. ${q.choices[userChoice]}` : "",
        modelAnswer: `${q.correctIndex + 1}. ${q.choices[q.correctIndex]}`,
        score: correct ? 10 : 0,
        maxScore: 10,
        passed: correct,
        feedback: q.feedback,
      };
    });
    onComplete(answers);
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">객관식 문제를 생성하고 있습니다...</p>
        <p className="text-xs">최대 30초 정도 소요될 수 있습니다</p>
      </div>
    );
  }

  if (error || totalQuestions === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error || "문제를 불러올 수 없습니다."}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        {/* Left nav button */}
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className={cn(
            "absolute -left-14 top-[55%] -translate-y-1/2 z-10",
            "flex size-10 items-center justify-center rounded-full",
            "border border-border bg-card shadow-sm transition-all",
            "hover:bg-muted hover:border-primary/40 hover:shadow-md",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
        >
          <ChevronLeft className="size-5 text-muted-foreground" />
        </button>

        {/* Right nav button */}
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === totalQuestions - 1}
          className={cn(
            "absolute -right-14 top-[55%] -translate-y-1/2 z-10",
            "flex size-10 items-center justify-center rounded-full",
            "border border-border bg-card shadow-sm transition-all",
            "hover:bg-muted hover:border-primary/40 hover:shadow-md",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
        >
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="relative min-h-[420px] flex flex-col">
            {/* Question content */}
            <div
              className={cn(
                "flex-1 flex flex-col p-6 transition-all duration-250",
                slideDirection === "left" && "animate-mc-slide-out-left",
                slideDirection === "right" && "animate-mc-slide-out-right",
                !slideDirection && "animate-mc-slide-in"
              )}
            >
              <div className="mb-6">
                <span className="text-xs font-medium text-muted-foreground">
                  Q{currentIndex + 1}.
                </span>
                <h2 className="mt-1.5 text-lg font-semibold leading-snug text-foreground">
                  {currentQ.question}
                </h2>
              </div>

              <div className="flex flex-col gap-2.5">
                {currentQ.choices.map((choice, i) => {
                  const isSelected = selectedAnswers[currentIndex] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                        "hover:border-primary/50 hover:bg-primary/5",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border bg-card text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{choice}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border px-6 py-4">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      "size-2 rounded-full transition-all",
                      i === currentIndex
                        ? "bg-primary scale-125"
                        : selectedAnswers[i] !== undefined
                          ? "bg-primary/40"
                          : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              <Button
                className="w-full"
                disabled={answeredCount < totalQuestions}
                onClick={handleSubmit}
              >
                {answeredCount < totalQuestions
                  ? `제출하기 (${answeredCount}/${totalQuestions})`
                  : "제출하기"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mcSlideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes mcSlideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(30px); }
        }
        @keyframes mcSlideIn {
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-mc-slide-out-left {
          animation: mcSlideOutLeft 0.2s ease-out forwards;
        }
        .animate-mc-slide-out-right {
          animation: mcSlideOutRight 0.2s ease-out forwards;
        }
        .animate-mc-slide-in {
          animation: mcSlideIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
