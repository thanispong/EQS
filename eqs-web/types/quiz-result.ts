export interface QuizReviewChoice {
  id: number;
  choiceText: string;
  sortOrder: number;
}

export interface QuizReviewItem {
  questionId: number;
  questionText: string;
  selectedChoiceId: number | null;
  correctChoiceId: number | null;
  isCorrect: boolean;
  explanation: string | null;
  choices: QuizReviewChoice[];
}

export interface QuizResult {
  id?: number;
  attemptId?: number;
  quizId?: number;
  quizTitle?: string;
  score: string | number;
  totalScore: string | number;
  correctCount: number;
  wrongCount: number;
  percentage: string | number;
  passingPercentage: string | number;
  isPassed: boolean;
  submittedAt?: string;
  status?: string;
  quiz?: {
    id: number;
    title: string;
  };
  review?: QuizReviewItem[];
}
