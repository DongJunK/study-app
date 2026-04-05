"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RoadmapViewMode = "timeline" | "card";
export type ThemeMode = "light" | "dark" | "system";

interface SettingsState {
  roadmapViewMode: RoadmapViewMode;
  roadmapLockEnabled: boolean;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  setRoadmapViewMode: (mode: RoadmapViewMode) => void;
  setRoadmapLockEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      roadmapViewMode: "timeline",
      roadmapLockEnabled: true,
      theme: "light",
      sidebarCollapsed: false,
      setRoadmapViewMode: (mode) => set({ roadmapViewMode: mode }),
      setRoadmapLockEnabled: (enabled) => set({ roadmapLockEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "study-settings",
    }
  )
);
