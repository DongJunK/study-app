import { create } from 'zustand';
import type { Topic } from '@/types/topic';
import type { ApiResult } from '@/types/api';

interface TopicState {
  topics: Topic[];
  isLoading: boolean;
  fetchTopics: () => Promise<void>;
  addTopic: (name: string) => Promise<Topic | null>;
  removeTopic: (topicId: string) => Promise<boolean>;
}

export const useTopicStore = create<TopicState>((set) => ({
  topics: [],
  isLoading: false,

  fetchTopics: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/topics');
      const json: ApiResult<Topic[]> = await res.json();
      if (json.success) {
        set({ topics: json.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addTopic: async (name: string) => {
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({ topics: [...state.topics, json.data] }));
        return json.data;
      }
      throw new Error(json.error?.message || '주제 추가에 실패했습니다.');
    } catch (e) {
      throw e instanceof Error ? e : new Error('주제 추가에 실패했습니다.');
    }
  },

  removeTopic: async (topicId: string) => {
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
      });
      const json: ApiResult<{ id: string }> = await res.json();
      if (json.success) {
        set((state) => ({
          topics: state.topics.filter((t) => t.id !== topicId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
