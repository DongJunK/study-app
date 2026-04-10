"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Terminal, LogIn, RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

const REASON_ICONS: Record<string, React.ElementType> = {
  not_installed: Terminal,
  not_authenticated: LogIn,
  network: Wifi,
  default: AlertTriangle,
};

function getReasonType(reason: string): string {
  if (reason.includes("설치")) return "not_installed";
  if (reason.includes("로그인") || reason.includes("인증")) return "not_authenticated";
  if (reason.includes("네트워크") || reason.includes("시간이 초과")) return "network";
  return "default";
}

function UnavailableContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Claude CLI를 사용할 수 없습니다.";
  const [checking, setChecking] = React.useState(false);

  const reasonType = getReasonType(reason);
  const Icon = REASON_ICONS[reasonType] || AlertTriangle;

  async function handleRetry() {
    setChecking(true);
    try {
      const res = await fetch("/api/claude/status");
      const json = await res.json();
      if (json.success && json.data.available) {
        window.location.href = "/";
      } else {
        // Still unavailable - reload with updated reason
        const newReason = json.data?.reason || reason;
        window.location.href = `/unavailable?reason=${encodeURIComponent(newReason)}`;
      }
    } catch {
      setChecking(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
          <Icon className="size-10 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">서비스 사용 불가</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            이 앱은 로컬에 설치된 Claude CLI를 사용하여 동작합니다.<br />
            아래 사유로 인해 현재 서비스를 이용할 수 없습니다.
          </p>
        </div>

        <div className="w-full rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-5">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{reason}</p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5 text-left space-y-3">
          <p className="text-sm font-semibold">사용 조건</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Terminal className="size-4 mt-0.5 shrink-0" />
              <span>Claude CLI가 설치되어 있어야 합니다<br />
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">npm install -g @anthropic-ai/claude-code</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <LogIn className="size-4 mt-0.5 shrink-0" />
              <span>Claude 계정에 로그인되어 있어야 합니다<br />
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">claude login</code>
              </span>
            </li>
          </ul>
        </div>

        <Button onClick={handleRetry} disabled={checking} className="gap-2">
          <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "확인 중..." : "다시 확인하기"}
        </Button>
      </div>
    </main>
  );
}

export default function UnavailablePage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            확인 중...
          </div>
        </main>
      }
    >
      <UnavailableContent />
    </React.Suspense>
  );
}
