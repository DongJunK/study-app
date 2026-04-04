"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle } from "lucide-react";
import type { GrowthData } from "@/lib/data/growthManager";

interface GrowthCardProps {
  data: GrowthData;
}

function useCountUp(target: number, duration = 500): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

export function GrowthCard({ data }: GrowthCardProps) {
  const { progressHistory, testScoreHistory, weaknessChanges, totalSessionMinutes } = data;

  // Calculate progress change
  const currentProgress = progressHistory.length > 0
    ? progressHistory[progressHistory.length - 1].progress
    : 0;
  const previousProgress = progressHistory.length > 1
    ? progressHistory[progressHistory.length - 2].progress
    : 0;
  const progressUp = currentProgress >= previousProgress;

  // Latest test score
  const latestTest = testScoreHistory.length > 0
    ? testScoreHistory[testScoreHistory.length - 1]
    : null;
  const prevTest = testScoreHistory.length > 1
    ? testScoreHistory[testScoreHistory.length - 2]
    : null;
  const testTrendUp = latestTest && prevTest
    ? (latestTest.score / latestTest.maxScore) >= (prevTest.score / prevTest.maxScore)
    : true;

  // Resolved weaknesses count
  const resolvedCount = weaknessChanges.filter((w) => w.to === "resolved").length;

  // Animated values
  const animatedProgress = useCountUp(currentProgress);
  const animatedMinutes = useCountUp(totalSessionMinutes);
  const animatedResolved = useCountUp(resolvedCount);
  const animatedScore = useCountUp(latestTest ? latestTest.score : 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
      <h3 className="text-lg font-semibold leading-tight">{data.topicName}</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Progress */}
        <div className="flex items-start gap-2">
          <div className={`mt-0.5 ${progressUp ? "text-emerald-500" : "text-red-500"}`}>
            {progressUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">진도 변화</p>
            <p className="text-sm font-medium">
              {previousProgress}%{" "}
              <span className={progressUp ? "text-emerald-500" : "text-red-500"}>
                &rarr;
              </span>{" "}
              {animatedProgress}%
            </p>
          </div>
        </div>

        {/* Test score */}
        <div className="flex items-start gap-2">
          <div className={`mt-0.5 ${testTrendUp ? "text-emerald-500" : "text-red-500"}`}>
            <Target className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">최근 테스트</p>
            {latestTest ? (
              <p className="text-sm font-medium">
                {animatedScore}/{latestTest.maxScore}
                {prevTest && (
                  <span className={`ml-1 text-xs ${testTrendUp ? "text-emerald-500" : "text-red-500"}`}>
                    {testTrendUp ? <TrendingUp className="inline size-3" /> : <TrendingDown className="inline size-3" />}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </div>

        {/* Resolved weaknesses */}
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 size-4 text-emerald-500" />
          <div>
            <p className="text-xs text-muted-foreground">해결된 약점</p>
            <p className="text-sm font-medium">{animatedResolved}개</p>
          </div>
        </div>

        {/* Total study time */}
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">총 학습 시간</p>
            <p className="text-sm font-medium">{animatedMinutes}분</p>
          </div>
        </div>
      </div>

      {/* Streak */}
      {data.currentStreak > 0 && (
        <div className="mt-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-center">
          <p className="text-xs font-medium text-amber-600">
            {data.currentStreak}일 연속 학습 중
          </p>
        </div>
      )}
    </div>
  );
}
