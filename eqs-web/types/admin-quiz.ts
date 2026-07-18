export interface QuizTopicSubject {
  id: number;
  name: string;
}

export interface QuizTopic {
  id: number;
  name: string;
  subject: QuizTopicSubject;
}

export interface AdminQuiz {
  id: number;
  topicId: number;
  title: string;
  description: string | null;
  passingPercentage: number | string;
  timeLimitMinutes: number | null;
  isShowAnswer: boolean;
  status: 'draft' | 'published';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic: QuizTopic;
}

export interface CreateQuizPayload {
  topicId: number;
  title: string;
  description?: string;
  passingPercentage: number;
  timeLimitMinutes?: number;
  isShowAnswer: boolean;
  status: 'draft' | 'published';
}

export interface UpdateQuizPayload {
  topicId?: number;
  title?: string;
  description?: string;
  passingPercentage?: number;
  timeLimitMinutes?: number | null;
  isShowAnswer?: boolean;
  status?: 'draft' | 'published';
  isActive?: boolean;
}