export interface TechNote {
  id: string;
  topicId: string;
  title: string;
  sourceType: 'session' | 'test' | 'diagnosis';
  sourceId: string;
  tags: string[];
  createdAt: string;
}

export interface TechNoteMeta {
  notes: TechNote[];
}

export interface NoteSource {
  sourceType: 'session' | 'test' | 'diagnosis';
  sourceId: string;
  title: string;
  date: string;
}
