import React from 'react';
import { Flag } from 'lucide-react';
import { Question, UserAnswer } from '../types/quiz';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  userAnswer: UserAnswer;
  mode: 'practice' | 'exam';
  showResult: boolean;
  onAnswerSelect: (answer: number) => void;
  onToggleMark: () => void;
  reviewMode?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  userAnswer,
  mode,
  showResult,
  onAnswerSelect,
  onToggleMark,
  reviewMode = false
}) => {

  const getOptionClass = (optionIndex: number) => {
    const baseClass = "w-full text-left p-3 md:p-5 border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors";

    if (!showResult) {
      return `${baseClass} ${userAnswer.selectedAnswer === optionIndex ? 'bg-blue-100 border-blue-500' : ''}`;
    }

    // Show results
    if (optionIndex === question.correctAnswer) {
      return `${baseClass.replace('hover:bg-blue-50 hover:border-blue-300', 'hover:bg-green-200 hover:border-green-600')} bg-green-100 border-green-500 text-green-800`;
    }

    if (userAnswer.selectedAnswer === optionIndex && optionIndex !== question.correctAnswer) {
      return `${baseClass.replace('hover:bg-blue-50 hover:border-blue-300', 'hover:bg-red-200 hover:border-red-600')} bg-red-100 border-red-500 text-red-800`;
    }

    return baseClass;
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // 0->A, 1->B, 2->C, 3->D
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 md:p-8">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            {reviewMode && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  🔄 Câu đã trả lời sai - Ôn luyện lại
                </span>
              </div>
            )}
            <h2 className="text-base md:text-lg lg:text-2xl font-medium text-gray-900 leading-snug">
              Câu {questionNumber}: {question.question}
            </h2>
          </div>
        </div>
        
        {/* Flag button - positioned below question */}
        <div className="flex justify-end">
          <button
            onClick={onToggleMark}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base transition-colors ${
              userAnswer.isMarked
                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Flag className={`w-4 h-4 md:w-5 md:h-5 ${userAnswer.isMarked ? 'text-red-600' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">
              {userAnswer.isMarked ? 'Đã đánh dấu' : 'Đánh dấu'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5 md:space-y-4">
        {question.options.map((option, index) => {

          // Bỏ qua đáp án trống
          if (!option || option.trim() === '') {
            return null;
          }

          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(index)}
              disabled={showResult}
              className={`${getOptionClass(index)} min-h-[48px] md:min-h-[64px]`}
            >
              <div className="flex items-start gap-2.5 md:gap-4">
                <span className="font-semibold text-gray-700 min-w-[24px] md:min-w-[28px] text-base md:text-lg lg:text-xl">
                  {getOptionLabel(index)}.
                </span>
                <span className="flex-1 text-left text-sm md:text-base lg:text-lg leading-snug md:leading-relaxed">{option}</span>
              </div>
            </button>
          );
        }).filter(Boolean)}
      </div>

      {showResult && mode === 'practice' && question.explanation && (
        <div className="mt-4 md:mt-6 p-3 md:p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1.5 md:mb-2 text-sm md:text-base">Giải thích:</h4>
          <p className="text-blue-800 text-sm md:text-base leading-snug md:leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};