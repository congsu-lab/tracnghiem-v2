import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { AuthModal } from './components/auth/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuestionCard } from './components/QuestionCard';
import { QuestionList } from './components/QuestionList';
import { QuizSetup } from './components/QuizSetup';
import { QuizResult } from './components/QuizResult';
import { SubmitConfirmModal } from './components/SubmitConfirmModal';
import { SessionTerminatedModal } from './components/SessionTerminatedModal';
import { InstallAppButton } from './components/InstallAppButton';
import { CustomAlert, closeCustomAlert } from './components/CustomAlert';
import { useTimer } from './hooks/useTimer';
import { selectQuestions, calculateScore } from './utils/questionUtils';
import { Question, QuizConfig, UserAnswer, QuizResult as QuizResultType } from './types/quiz';
import { useAuth } from './hooks/useAuth';
import { useQuestions } from './hooks/useQuestions';

type AppState = 'auth' | 'dashboard' | 'quiz' | 'result';

function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultType | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSessionTerminated, setShowSessionTerminated] = useState(false);

  const { user, loading: authLoading, isAuthenticated, isAdmin, error, logout, isSupabaseConfigured } = useAuth();
  const { questions, loading: questionsLoading, error: questionsError, loadQuestions, saveQuestions, addQuestions, clearQuestions } = useQuestions();

  useEffect(() => {
    const handleSessionTerminated = () => {
      setShowSessionTerminated(true);
    };

    window.addEventListener('sessionTerminated', handleSessionTerminated);
    return () => window.removeEventListener('sessionTerminated', handleSessionTerminated);
  }, []);

  const handleSessionTerminatedClose = async () => {
    setShowSessionTerminated(false);
    await logout();
    setAppState('auth');
    setShowAuthModal(true);
  };

  useEffect(() => {
    const handleShowAlert = (event: CustomEvent) => {
      const { title, message } = event.detail;
      setCustomAlert({ isOpen: true, title, message });
    };

    window.addEventListener('showCustomAlert', handleShowAlert as EventListener);

    return () => {
      window.removeEventListener('showCustomAlert', handleShowAlert as EventListener);
    };
  }, []);

  const handleCloseAlert = () => {
    setCustomAlert({ isOpen: false, title: '', message: '' });
    closeCustomAlert();
  };

  useEffect(() => {
    console.log('🔄 App: Kiểm tra auth state:', { isAuthenticated, authLoading });

    if (!authLoading) {
      if (isAuthenticated) {
        console.log('✅ App: User đã đăng nhập, chuyển sang dashboard');
        setAppState('dashboard');
        setShowAuthModal(false);

        // QUAN TRỌNG: Reload questions mỗi khi user đăng nhập để đảm bảo có dữ liệu mới nhất
        console.log('🔄 App: Reload questions sau khi đăng nhập...');
        loadQuestions();
      } else {
        console.log('ℹ️ App: User chưa đăng nhập, hiển thị auth screen');
        setAppState('auth');
        setShowAuthModal(true);
      }
    }
  }, [isAuthenticated, authLoading, loadQuestions]);
  const handleTimeUp = () => {
    handleSubmitQuiz();
  };

  const { timeRemaining, start: startTimer, reset: resetTimer } = useTimer(
    quizConfig?.timeLimit || 3600,
    handleTimeUp
  );

  const handleStartQuiz = (config: QuizConfig) => {
    // Safeguard: prevent starting quiz if no questions available
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để bắt đầu bài thi. Vui lòng thêm câu hỏi trước.');
      return;
    }
    
    const selectedQuestions = selectQuestions(questions, config);
    if (selectedQuestions.length === 0) {
      alert('Không thể chọn được câu hỏi phù hợp với cấu hình. Vui lòng kiểm tra lại.');
      return;
    }
    
    // Validate timeLimit
    const validTimeLimit = typeof config.timeLimit === 'number' && !isNaN(config.timeLimit) && config.timeLimit > 0 
      ? config.timeLimit 
      : 3600; // Default 1 hour
    
    console.log('🔄 Starting quiz with timeLimit:', validTimeLimit, 'seconds');
    
    setQuizQuestions(selectedQuestions);
    setQuizConfig(config);
    setCurrentQuestionIndex(0);
    setUserAnswers(
      selectedQuestions.map(q => ({
        questionId: q.id,
        selectedAnswer: null,
        isMarked: false,
        timeSpent: 0
      }))
    );
    setStartTime(Date.now());
    resetTimer(validTimeLimit);
    setTimeout(() => {
      startTimer();
    }, 100); // Small delay để đảm bảo reset hoàn tất
    setAppState('quiz');
  };

  const handleAnswerSelect = (answer: number) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        selectedAnswer: answer
      };
      return updated;
    });
  };

  const handleToggleMark = () => {
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        isMarked: !updated[currentQuestionIndex].isMarked
      };
      return updated;
    });
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (direction === 'next' && currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = () => {
    // Hiển thị modal xác nhận thay vì window.confirm
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = calculateScore(quizQuestions, userAnswers);
    
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer.selectedAnswer === quizQuestions[index].correctAnswer
    ).length;
    
    const wrongAnswers = userAnswers.filter((answer, index) => 
      answer.selectedAnswer !== null && answer.selectedAnswer !== quizQuestions[index].correctAnswer
    ).length;
    
    const unanswered = userAnswers.filter(answer => answer.selectedAnswer === null).length;

    // Tổng hợp câu trả lời sai để ôn luyện
    const wrongQuestions = quizQuestions.filter((question, index) => {
      const userAnswer = userAnswers[index];
      return userAnswer.selectedAnswer !== null && userAnswer.selectedAnswer !== question.correctAnswer;
    });

    const result: QuizResultType = {
      totalQuestions: quizQuestions.length,
      correctAnswers,
      wrongAnswers,
      unanswered,
      score,
      timeSpent: totalTimeSpent,
      answers: userAnswers,
      wrongQuestions
    };

    setQuizResult(result);
    setAppState('result');
  };

  const handleRestart = () => {
    console.log('🔄 Restarting quiz...');
    setAppState('dashboard');
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizQuestions([]);
    setQuizConfig(null);
    setReviewMode(false);
    setReviewQuestions([]);
  };

  const handleReviewWrongAnswers = (wrongQuestions: Question[]) => {
    console.log('🔄 Bắt đầu ôn luyện câu sai:', wrongQuestions.length, 'câu');
    
    // Cấu hình cho chế độ ôn luyện
    const reviewConfig: QuizConfig = {
      mode: 'practice', // Luôn dùng practice mode để hiện đáp án
      timeLimit: 3600, // 1 giờ
      totalQuestions: wrongQuestions.length,
      categories: {}
    };
    
    setQuizQuestions(wrongQuestions);
    setQuizConfig(reviewConfig);
    setCurrentQuestionIndex(0);
    setUserAnswers(
      wrongQuestions.map(q => ({
        questionId: q.id,
        selectedAnswer: null,
        isMarked: false,
        timeSpent: 0
      }))
    );
    setStartTime(Date.now());
    setReviewMode(true);
    resetTimer(reviewConfig.timeLimit);
    startTimer();
    setAppState('quiz');
  };

  // Update time spent for current question
  useEffect(() => {
    if (appState === 'quiz' && quizConfig) {
      const interval = setInterval(() => {
        setUserAnswers(prev => {
          const updated = [...prev];
          if (updated[currentQuestionIndex]) {
            updated[currentQuestionIndex] = {
              ...updated[currentQuestionIndex],
              timeSpent: updated[currentQuestionIndex].timeSpent + 1
            };
          }
          return updated;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [appState, currentQuestionIndex, quizConfig]);

  // Show loading while checking authentication
  if (authLoading || questionsLoading) {
    console.log('🔄 App: Hiển thị loading screen:', { authLoading, questionsLoading });
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Đang kiểm tra đăng nhập...' : 'Đang tải câu hỏi...'}
          </p>
          
          
          {/* Debug info */}
          <details className="mt-4 max-w-md mx-auto">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              🔧 Debug Info (click để xem)
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-left text-xs">
            <p><strong>Debug Loading:</strong></p>
            <p>Auth Loading: {authLoading ? 'true' : 'false'}</p>
            <p>Questions Loading: {questionsLoading ? 'true' : 'false'}</p>
            <p>Questions Count: {questions.length}</p>
            <p>Questions Error: {questionsError || 'none'}</p>
            <p>Auth Error: {error || 'none'}</p>
            <p>Supabase Configured: {isSupabaseConfigured ? 'true' : 'false'}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
          </details>
        </div>
      </div>
    );
  }

  // Show error if auth failed
  if (!authLoading && !isAuthenticated && error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lỗi kết nối
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication screen
  if (appState === 'auth' || !isAuthenticated) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => {}} // Không cho đóng modal khi chưa đăng nhập
      />
    );
  }

  // Show appropriate dashboard based on user role
  if (appState === 'dashboard') {
    return (
      <>
        <InstallAppButton />
        {isAdmin ? (
          <AdminDashboard
            onStartQuiz={handleStartQuiz}
            questions={questions}
            loading={questionsLoading}
            error={questionsError}
            onQuestionsImport={async (questions, replaceAll) => {
              console.log(`🚀 Bắt đầu import ${questions.length} câu hỏi...`);

              if (replaceAll) {
                const success = await saveQuestions(questions);
                if (success) {
                  console.log(`✅ Import hoàn tất: ${questions.length} câu hỏi`);
                  console.log('🔄 Đang reload dữ liệu...');
                  await loadQuestions();

                  // Đếm số chuyên đề
                  const categories = [...new Set(questions.map(q => q.category))];

                  setTimeout(() => {
                    alert(`✅ Import thành công!\n\n📊 Tổng: ${questions.length.toLocaleString()} câu hỏi\n📚 Chuyên đề: ${categories.length}\n\n💡 Dữ liệu đã được cập nhật.`);
                  }, 500);
                } else {
                  alert(`❌ Import thất bại. Vui lòng kiểm tra console log.`);
                }
              } else {
                const success = await addQuestions(questions);
                if (success) {
                  console.log(`✅ Import hoàn tất: ${questions.length} câu hỏi`);
                  console.log('🔄 Đang reload dữ liệu để cập nhật chuyên đề...');

                  // QUAN TRỌNG: Reload để cập nhật danh sách chuyên đề
                  await loadQuestions();

                  // Đếm số chuyên đề từ dữ liệu vừa load
                  const categories = [...new Set(questions.map(q => q.category))];

                  setTimeout(() => {
                    alert(`✅ Import thành công!\n\n📊 Đã thêm: ${questions.length.toLocaleString()} câu hỏi\n📚 Chuyên đề: ${categories.length}\n\n💡 Dữ liệu và chuyên đề đã được cập nhật.\n\n🔄 Nếu không thấy thay đổi, vui lòng refresh trang (F5).`);
                  }, 500);
                } else {
                  alert(`❌ Import thất bại. Vui lòng kiểm tra console log.`);
                }
              }
            }}
            onClearQuestions={clearQuestions}
          />
        ) : (
          <UserDashboard 
            onStartQuiz={handleStartQuiz}
            questions={questions}
            loading={questionsLoading}
          />
        )}
      </>
    );
  }

  if (appState === 'result' && quizResult) {
    return (
      <QuizResult
        result={quizResult}
        questions={quizQuestions}
        onRestart={handleRestart}
        mode={quizConfig?.mode || 'practice'}
        onReviewWrongAnswers={handleReviewWrongAnswers}
      />
    );
  }

  if (appState === 'quiz' && quizConfig) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const currentAnswer = userAnswers[currentQuestionIndex];
    
    // Safety check: ensure we have valid data
    if (!currentQuestion || !currentAnswer) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Lỗi: Không thể tải câu hỏi</p>
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header
          mode={quizConfig.mode}
          timeRemaining={timeRemaining}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={quizQuestions.length}
          reviewMode={reviewMode}
        />

        <main className="flex-1 p-6 pb-40">
          <div className="max-w-4xl mx-auto">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              userAnswer={currentAnswer}
              mode={quizConfig.mode}
              showResult={quizConfig.mode === 'practice' && currentAnswer.selectedAnswer !== null}
              onAnswerSelect={handleAnswerSelect}
              onToggleMark={handleToggleMark}
              reviewMode={reviewMode}
            />
          </div>
        </main>

        <Footer
          onSubmit={handleSubmitQuiz}
          onShowQuestionList={() => setShowQuestionList(true)}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={quizQuestions.length}
          onNavigate={handleNavigate}
          canNavigatePrev={currentQuestionIndex > 0}
          canNavigateNext={currentQuestionIndex < quizQuestions.length - 1}
        />
        
        {showQuestionList && (
          <QuestionList
            questions={quizQuestions}
            userAnswers={userAnswers}
            currentQuestion={currentQuestionIndex}
            onQuestionSelect={setCurrentQuestionIndex}
            onClose={() => setShowQuestionList(false)}
          />
        )}
        
        <SubmitConfirmModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleConfirmSubmit}
          reviewMode={reviewMode}
          stats={{
            answered: userAnswers.filter(a => a.selectedAnswer !== null).length,
            total: quizQuestions.length,
            unanswered: userAnswers.filter(a => a.selectedAnswer === null).length,
            marked: userAnswers.filter(a => a.isMarked).length
          }}
        />

        {showSessionTerminated && (
          <SessionTerminatedModal onClose={handleSessionTerminatedClose} />
        )}
      </div>
    );
  }

  return (
    <>
      {showSessionTerminated && (
        <SessionTerminatedModal onClose={handleSessionTerminatedClose} />
      )}

      <CustomAlert
        title={customAlert.title}
        message={customAlert.message}
        isOpen={customAlert.isOpen}
        onClose={handleCloseAlert}
      />
    </>
  );
}

export default App;