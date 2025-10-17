import React from 'react';
import { X, Flag, Check, AlertCircle } from 'lucide-react';
import { Question, UserAnswer } from '../types/quiz';

interface QuestionListProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  currentQuestion: number;
  onQuestionSelect: (index: number) => void;
  onClose: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  userAnswers,
  currentQuestion,
  onQuestionSelect,
  onClose
}) => {
  const getQuestionStatus = (index: number) => {
    const answer = userAnswers[index];
    if (answer.selectedAnswer !== null) {
      return answer.isMarked ? 'answered-marked' : 'answered';
    }
    return answer.isMarked ? 'marked' : 'unanswered';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'answered-marked':
        return (
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600" />
            <Flag className="w-3 h-3 text-yellow-600" />
          </div>
        );
      case 'marked':
        return <Flag className="w-4 h-4 text-yellow-600" />;
      case 'unanswered':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusClass = (index: number, status: string) => {
    const baseClass = "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors";
    const isActive = index === currentQuestion;
    
    if (isActive) {
      return `${baseClass} border-blue-500 bg-blue-50`;
    }
    
    switch (status) {
      case 'answered':
        return `${baseClass} border-green-300 bg-green-50 hover:bg-green-100`;
      case 'answered-marked':
        return `${baseClass} border-yellow-300 bg-yellow-50 hover:bg-yellow-100`;
      case 'marked':
        return `${baseClass} border-yellow-300 bg-yellow-50 hover:bg-yellow-100`;
      case 'unanswered':
        return `${baseClass} border-gray-300 bg-white hover:bg-gray-50`;
      default:
        return `${baseClass} border-gray-300 bg-white hover:bg-gray-50`;
    }
  };

  const stats = {
    answered: userAnswers.filter(a => a.selectedAnswer !== null && !a.isMarked).length,
    answeredMarked: userAnswers.filter(a => a.selectedAnswer !== null && a.isMarked).length,
    marked: userAnswers.filter(a => a.selectedAnswer === null && a.isMarked).length,
    unanswered: userAnswers.filter(a => a.selectedAnswer === null && !a.isMarked).length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Danh sách câu hỏi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Đã trả lời: {stats.answered}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                <Flag className="w-3 h-3 text-yellow-600" />
              </div>
              <span>Đã trả lời + Đánh dấu: {stats.answeredMarked}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-yellow-600" />
              <span>Chỉ đánh dấu: {stats.marked}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span>Chưa trả lời: {stats.unanswered}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <button
                  key={index}
                  onClick={() => {
                    onQuestionSelect(index);
                    onClose();
                  }}
                  className={getStatusClass(index, status)}
                >
                  <span className="font-medium">Câu {index + 1}</span>
                  {getStatusIcon(status)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};