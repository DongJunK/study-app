export interface Topic {
  id: string; // kebab-case slug from topic name
  name: string; // display name
  progress: number; // 0-100
  lastStudyDate: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  weaknessCount: number;
  status: 'new' | 'in-progress' | 'completed';
  level: 'beginner' | 'intermediate' | 'advanced' | null;
}

export interface RoadmapItem {
  id: string;
  title: string;
  order: number;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  isCustom: boolean; // user-added items
}

export interface Roadmap {
  topicId: string;
  items: RoadmapItem[];
  currentItemIndex: number;
}
