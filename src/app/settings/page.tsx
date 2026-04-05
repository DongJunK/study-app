"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSettingsStore, type RoadmapViewMode, type ThemeMode } from "@/stores/settingsStore";
import { ArrowLeft, Sun, Moon, Monitor, LayoutList, LayoutGrid, Lock, Unlock, PanelLeft, Square } from "lucide-react";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];

const ROADMAP_VIEW_OPTIONS: { value: RoadmapViewMode; label: string; description: string; icon: React.ElementType }[] = [
  { value: "timeline", label: "타임라인", description: "세로 타임라인 형태로 노출", icon: LayoutList },
  { value: "card", label: "카드뷰", description: "카드 그리드 형태로 노출", icon: LayoutGrid },
];

export default function SettingsPage() {
  const router = useRouter();
  const { setTheme: setNextTheme } = useTheme();
  const {
    roadmapViewMode,
    roadmapLockEnabled,
    theme,
    sidebarCollapsed,
    setRoadmapViewMode,
    setRoadmapLockEnabled,
    setTheme,
    setSidebarCollapsed,
  } = useSettingsStore();

  function handleThemeChange(newTheme: ThemeMode) {
    setTheme(newTheme);
    setNextTheme(newTheme);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            뒤로
          </Button>
          <h1 className="text-2xl font-semibold">설정</h1>
          <p className="text-sm text-muted-foreground mt-1">학습 환경을 설정합니다</p>
        </div>

        <div className="space-y-8">
          {/* Theme */}
          <section>
            <h2 className="text-base font-semibold mb-1">테마 설정</h2>
            <p className="text-sm text-muted-foreground mb-4">앱의 밝기 모드를 선택합니다</p>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleThemeChange(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sidebar Mode */}
          <section>
            <h2 className="text-base font-semibold mb-1">사이드바 모드</h2>
            <p className="text-sm text-muted-foreground mb-4">네비게이션 사이드바의 표시 방식을 선택합니다</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: false, label: "사이드바", description: "아이콘 + 메뉴명 표시", icon: PanelLeft },
                { value: true, label: "아이콘바", description: "아이콘만 표시", icon: Square },
              ] as const).map((opt) => {
                const isSelected = sidebarCollapsed === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setSidebarCollapsed(opt.value)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Roadmap View Mode */}
          <section>
            <h2 className="text-base font-semibold mb-1">학습 로드맵 노출 방식</h2>
            <p className="text-sm text-muted-foreground mb-4">로드맵 항목을 어떤 형태로 볼지 선택합니다</p>
            <div className="grid grid-cols-2 gap-3">
              {ROADMAP_VIEW_OPTIONS.map((opt) => {
                const isSelected = roadmapViewMode === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRoadmapViewMode(opt.value)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Roadmap Lock */}
          <section>
            <h2 className="text-base font-semibold mb-1">학습 로드맵 잠김</h2>
            <p className="text-sm text-muted-foreground mb-4">
              활성화하면 이전 항목을 완료해야 다음 항목이 해제됩니다. 비활성화하면 모든 항목을 자유롭게 학습할 수 있습니다.
            </p>
            <button
              onClick={() => setRoadmapLockEnabled(!roadmapLockEnabled)}
              className={`flex w-full items-center justify-between rounded-xl border p-4 transition-colors ${
                roadmapLockEnabled
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${
                  roadmapLockEnabled ? "bg-primary/10" : "bg-muted"
                }`}>
                  {roadmapLockEnabled ? (
                    <Lock className="size-5 text-primary" />
                  ) : (
                    <Unlock className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{roadmapLockEnabled ? "잠김 활성화" : "잠김 비활성화"}</p>
                  <p className="text-xs text-muted-foreground">
                    {roadmapLockEnabled
                      ? "순서대로 학습해야 합니다"
                      : "모든 항목을 자유롭게 학습합니다"
                    }
                  </p>
                </div>
              </div>
              <div className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                roadmapLockEnabled ? "bg-primary" : "bg-muted"
              }`}>
                <div className={`size-5 rounded-full bg-white shadow transition-transform ${
                  roadmapLockEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
