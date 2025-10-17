export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
}

export interface QuizConfig {
  mode: 'practice' | 'exam';
  timeLimit: number;
  totalQuestions: number;
  categories: Record<string, number>;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number | null;
  isMarked: boolean;
  timeSpent: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  score: number;
  timeSpent: number;
  answers: UserAnswer[];
  wrongQuestions?: Question[];
}
