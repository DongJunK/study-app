"use client";

import { create } from 'zustand';
import type { Weakness, WeaknessStatus } from '@/types/weakness';
import type { ApiResult } from '@/types/api';

interface WeaknessState {
  weaknesses: Record<string, Weakness[]>; // keyed by topicId
  isLoading: boolean;
  fetchWeaknesses: (topicId: string) => Promise<void>;
  updateStatus: (topicId: string, weaknessId: string, status: WeaknessStatus) => Promise<void>;
}

export const useWeaknessStore = create<WeaknessState>((set) => ({
  weaknesses: {},
  isLoading: false,

  fetchWeaknesses: async (topicId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/topics/${topicId}/weakness`);
      const json: ApiResult<Weakness[]> = await res.json();
      if (json.success) {
        set((state) => ({
          weaknesses: { ...state.weaknesses, [topicId]: json.data },
        }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateStatus: async (topicId: string, weaknessId: string, status: WeaknessStatus) => {
    try {
      const res = await fetch(`/api/topics/${topicId}/weakness`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaknessId, status }),
      });
      const json: ApiResult<Weakness[]> = await res.json();
      if (json.success) {
        set((state) => ({
          weaknesses: { ...state.weaknesses, [topicId]: json.data },
        }));
      }
    } catch {
      // silently fail
    }
  },
}));
