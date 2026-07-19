export interface QuizHistorySubject {
  id: number;
  name: string;
}

export interface QuizHistoryTopic {
  id: number;
  name: string;
  subject: QuizHistorySubject;
}

export interface QuizHistoryQuiz {
  id: number;
  title: string;
  topic: QuizHistoryTopic;
}

export interface QuizHistoryItem {
  id: number;
  quizId: number;
  startedAt: string;
  submittedAt: string | null;
  score: string | number;
  totalScore: string | number;
  correctCount: number;
  wrongCount: number;
  percentage: string | number;
  isPassed: boolean | null;
  status: string;
  quiz: QuizHistoryQuiz;
}