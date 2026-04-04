"use client";

import { create } from 'zustand';
import type { TestType, TestAnswer } from '@/types/test';

interface CurrentTest {
  topicId: string;
  type: TestType;
  duration: number;
  answers: TestAnswer[];
  currentScore: number;
  maxScore: number;
}

interface TestState {
  currentTest: CurrentTest | null;
  isStreaming: boolean;
  phase: 'setup' | 'testing' | 'results' | 'comparison' | 'followup';
  startTest: (topicId: string, type: TestType, duration: number) => void;
  addAnswer: (answer: TestAnswer) => void;
  setStreaming: (streaming: boolean) => void;
  setPhase: (phase: TestState['phase']) => void;
  endTest: () => void;
  reset: () => void;
}

export const useTestStore = create<TestState>((set) => ({
  currentTest: null,
  isStreaming: false,
  phase: 'setup',

  startTest: (topicId: string, type: TestType, duration: number) =>
    set({
      currentTest: {
        topicId,
        type,
        duration,
        answers: [],
        currentScore: 0,
        maxScore: 0,
      },
      phase: 'testing',
    }),

  addAnswer: (answer: TestAnswer) =>
    set((state) => {
      if (!state.currentTest) return state;
      const answers = [...state.currentTest.answers, answer];
      const currentScore = answers.reduce((sum, a) => sum + a.score, 0);
      const maxScore = answers.reduce((sum, a) => sum + a.maxScore, 0);
      return {
        currentTest: {
          ...state.currentTest,
          answers,
          currentScore,
          maxScore,
        },
      };
    }),

  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

  setPhase: (phase) => set({ phase }),

  endTest: () =>
    set((state) => ({
      ...state,
      phase: 'results',
    })),

  reset: () =>
    set({
      currentTest: null,
      isStreaming: false,
      phase: 'setup',
    }),
}));
