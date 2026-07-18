export interface TopicSubject {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  subjectId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject: TopicSubject;
}

export interface CreateTopicPayload {
  subjectId: number;
  name: string;
  description?: string;
}

export interface UpdateTopicPayload {
  subjectId?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}