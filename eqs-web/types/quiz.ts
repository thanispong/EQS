export interface QuizSubject {
  id: number;
  name: string;
}

export interface QuizTopic {
  id: number;
  name: string;
  subject: QuizSubject;
}

export interface QuizItem {
  id: number;
  topicId: number;
  title: string;
  description: string | null;
  passingPercentage: string | number;
  timeLimitMinutes: number | null;
  isShowAnswer: boolean;
  status: string;
  isActive: boolean;
  topic: QuizTopic;
  _count?: {
    questions: number;
    quizAttempts: number;
  };
}

export interface QuizChoice {
  id: number;
  choiceText: string;
  sortOrder: number;
}

export interface AttemptQuestion {
  id: number;
  questionText: string;
  score: string | number;
  sortOrder: number;
  choices: QuizChoice[];
}

export interface StartAttemptResponse {
  attempt: {
    id: number;
    quizId: number;
    startedAt: string;
    status: string;
  };
  quiz: {
    id: number;
    title: string;
    description: string | null;
    timeLimitMinutes: number | null;
    totalScore: number;
    questions: AttemptQuestion[];
  };
}