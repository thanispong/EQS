export interface AdminQuestionChoice {
  id?: number;
  choiceText: string;
  isCorrect: boolean;
  sortOrder: number;
  isActive?: boolean;
}

export interface QuestionQuiz {
  id: number;
  title: string;
}

export interface AdminQuestion {
  id: number;
  quizId: number;
  questionText: string;
  explanation: string | null;
  score: number | string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  choices: AdminQuestionChoice[];
  quiz: QuestionQuiz;
}

export interface QuestionChoicePayload {
  choiceText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface CreateQuestionPayload {
  quizId: number;
  questionText: string;
  explanation?: string;
  score: number;
  sortOrder: number;
  choices: QuestionChoicePayload[];
}

export interface UpdateQuestionPayload {
  quizId?: number;
  questionText?: string;
  explanation?: string;
  score?: number;
  sortOrder?: number;
  choices?: QuestionChoicePayload[];
}