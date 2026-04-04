"use client";

import { create } from 'zustand';
import type { Message } from '@/types/session';

interface SessionState {
  currentTopicId: string | null;
  messages: Message[];
  isStreaming: boolean;
  diagnosisComplete: boolean;
  diagnosisResult: string | null;
  setCurrentTopic: (topicId: string) => void;
  addMessage: (message: Message) => void;
  updateLastAssistantMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setDiagnosisComplete: (complete: boolean) => void;
  setDiagnosisResult: (result: string | null) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentTopicId: null,
  messages: [],
  isStreaming: false,
  diagnosisComplete: false,
  diagnosisResult: null,

  setCurrentTopic: (topicId: string) => set({ currentTopicId: topicId }),

  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (content: string) =>
    set((state) => {
      const msgs = [...state.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs };
    }),

  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

  setDiagnosisComplete: (complete: boolean) =>
    set({ diagnosisComplete: complete }),

  setDiagnosisResult: (result: string | null) => set({ diagnosisResult: result }),

  clearMessages: () => set({ messages: [] }),

  reset: () =>
    set({
      currentTopicId: null,
      messages: [],
      isStreaming: false,
      diagnosisComplete: false,
      diagnosisResult: null,
    }),
}));
