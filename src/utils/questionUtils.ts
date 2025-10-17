import { Question, QuizConfig, UserAnswer } from '../types/quiz';

export function selectQuestions(questions: Question[], config: QuizConfig): Question[] {
  if (Object.keys(config.categories).length === 0) {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.totalQuestions);
  }

  const selectedQuestions: Question[] = [];

  for (const [category, count] of Object.entries(config.categories)) {
    if (count <= 0) continue;

    const categoryQuestions = questions.filter(q => q.category === category);

    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);

    const selected = shuffled.slice(0, count);

    selectedQuestions.push(...selected);
  }

  return selectedQuestions.sort(() => Math.random() - 0.5);
}

export function calculateScore(questions: Question[], userAnswers: UserAnswer[]): number {
  let correctCount = 0;

  userAnswers.forEach((answer, index) => {
    if (answer.selectedAnswer === questions[index].correctAnswer) {
      correctCount++;
    }
  });

  return (correctCount / questions.length) * 100;
}
