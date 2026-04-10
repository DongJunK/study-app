"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

const BYPASS_PATHS = ["/unavailable", "/settings"];
const CACHE_KEY = "claude-status-verified";

export function ClaudeGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isCached = typeof window !== "undefined" && sessionStorage.getItem(CACHE_KEY) === "true";
  const [checked, setChecked] = React.useState(isCached);
  const [available, setAvailable] = React.useState(isCached);

  React.useEffect(() => {
    if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
      setChecked(true);
      setAvailable(true);
      return;
    }

    // Already verified this session
    if (sessionStorage.getItem(CACHE_KEY) === "true") {
      setChecked(true);
      setAvailable(true);
      return;
    }

    let cancelled = false;

    async function checkStatus() {
      try {
        const res = await fetch("/api/claude/status");
        const json = await res.json();
        if (cancelled) return;

        if (json.success && json.data.available) {
          setAvailable(true);
          sessionStorage.setItem(CACHE_KEY, "true");
        } else {
          setAvailable(false);
          const reason = json.data?.reason || "Claude CLI를 사용할 수 없습니다.";
          router.replace(`/unavailable?reason=${encodeURIComponent(reason)}`);
        }
      } catch {
        // Network error to our own API - likely server issue, allow through
        setAvailable(true);
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    checkStatus();
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          시스템 환경을 확인하고 있습니다...
        </div>
      </div>
    );
  }

  if (!available) return null;

  return <>{children}</>;
}
