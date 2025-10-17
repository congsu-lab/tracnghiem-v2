import React, { useEffect, useState } from 'react';
import { Home, Trophy, Clock, BookOpen } from 'lucide-react';
import { Question, QuizResult as QuizResultType, UserAnswer } from '../types/quiz';
import { generateCSV } from '../utils/csvParser';
import { supabase } from '../lib/supabase';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface QuizResultProps {
  result: QuizResultType;
  questions: Question[];
  onRestart: () => void;
  mode: 'practice' | 'exam';
  onReviewWrongAnswers?: (wrongQuestions: Question[]) => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  result,
  questions,
  onRestart,
  mode,
  onReviewWrongAnswers
}) => {
  const { user } = useSimpleAuth();
  const [savedToDb, setSavedToDb] = useState(false);

  useEffect(() => {
    const saveQuizResult = async () => {
      if (!user || !supabase || savedToDb) return;

      // Only save exam mode results, not practice or review mode
      if (mode !== 'exam') {
        console.log('Không lưu kết quả cho chế độ:', mode);
        return;
      }

      try {
        const quizResultData = {
          user_id: user.id,
          score: result.score,
          total_questions: result.correctAnswers + result.wrongAnswers + result.unanswered,
          correct_answers: result.correctAnswers,
          percentage: result.score,
          time_spent: result.timeSpent,
          quiz_type: mode
        };

        const { error } = await supabase
          .from('quiz_results')
          .insert([quizResultData]);

        if (error) {
          console.error('Lỗi lưu kết quả:', error);
        } else {
          console.log('Đã lưu kết quả thi thử thành công');
          setSavedToDb(true);

          window.dispatchEvent(new CustomEvent('quizCompleted'));
        }
      } catch (error) {
        console.error('Lỗi khi lưu kết quả:', error);
      }
    };

    saveQuizResult();
  }, [user, result, mode, savedToDb]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const exportResults = () => {
    const headers = ['question', 'correct_answer', 'user_answer', 'result', 'time_spent'];
    const data = result.answers.map((answer, index) => {
      const question = questions[index];
      const correctAnswer = String.fromCharCode(64 + question.correctAnswer); // 1->A, 2->B, etc.
      const userAnswer = answer.selectedAnswer ? String.fromCharCode(64 + answer.selectedAnswer) : 'Không trả lời';
      const isCorrect = answer.selectedAnswer === question.correctAnswer ? 'Đúng' : 'Sai';
      
      return {
        question: question.question,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        result: isCorrect,
        time_spent: answer.timeSpent.toString()
      };
    });
    
    const csvContent = generateCSV(data, headers);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz_result_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = () => {
    if (result.score >= 80) return 'text-green-600';
    if (result.score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (result.score >= 80) return 'Xuất sắc!';
    if (result.score >= 60) return 'Khá tốt!';
    return 'Cần cố gắng thêm!';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-agribank-primary text-white px-6 py-4 border-b border-gray-300">
        <div className="flex items-center gap-4">
          <Trophy className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Kết quả bài thi</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Overall Results */}
        <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-6xl font-bold ${getScoreColor()} mb-2`}>
              {result.score.toFixed(1)}%
            </div>
            <div className="text-xl text-gray-600 mb-4">{getScoreMessage()}</div>
            
            {result.wrongQuestions && result.wrongQuestions.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 font-medium">
                  📚 Bạn có {result.wrongQuestions.length} câu trả lời sai cần ôn luyện lại
                </p>
                <p className="text-orange-700 text-sm mt-1">
                  Click nút "Ôn luyện câu sai" để làm lại những câu này
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-sm text-green-800">Câu đúng</div>
            </div>
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.wrongAnswers}</div>
              <div className="text-sm text-red-800">Câu sai</div>
            </div>
            <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{result.unanswered}</div>
              <div className="text-sm text-gray-800">Chưa trả lời</div>
            </div>
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatTime(result.timeSpent)}</div>
              <div className="text-sm text-blue-800">Thời gian</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
          {result.wrongQuestions && result.wrongQuestions.length > 0 && onReviewWrongAnswers && (
            <button
              onClick={() => onReviewWrongAnswers(result.wrongQuestions!)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Ôn luyện câu sai ({result.wrongQuestions.length})
            </button>
          )}
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-agribank-primary text-white rounded-lg hover:bg-agribank-dark transition-colors"
          >
            <Home className="w-4 h-4" />
            Làm bài mới
          </button>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-lg border border-gray-300 p-6">
          <h2 className="text-lg font-semibold mb-4">Chi tiết từng câu</h2>
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <h2 className="text-lg font-semibold mb-4">Chi tiết từng câu</h2>
            <div className="space-y-4">
              {result.answers.map((answer, index) => {
                const question = questions[index];
                const isCorrect = answer.selectedAnswer === question.correctAnswer;
                const getOptionLabel = (optionIndex: number) => String.fromCharCode(65 + optionIndex);

                return (
                  <div key={index} className={`p-3 md:p-4 border rounded-lg ${
                    isCorrect ? 'border-green-300 bg-green-50' :
                    answer.selectedAnswer !== null ? 'border-red-300 bg-red-50' :
                    'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="mb-2">
                      <h3 className="text-sm md:text-base font-medium">{index + 1}. {question.question}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Đáp án đúng: </span>
                        <span className="text-green-600">
                          {getOptionLabel(question.correctAnswer)}. {question.options[question.correctAnswer]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Bạn chọn: </span>
                        {answer.selectedAnswer !== null ? (
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {getOptionLabel(answer.selectedAnswer)}. {question.options[answer.selectedAnswer]}
                          </span>
                        ) : (
                          <span className="text-gray-500">Không trả lời</span>
                        )}
                      </div>
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <span className="font-medium text-blue-900 text-xs">Giải thích: </span>
                        <span className="text-blue-800 text-xs">{question.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};