import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Trophy, Clock, Target, User, LogOut, Key } from 'lucide-react';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useQuizTemplates } from '../hooks/useQuizTemplates';
import { QuizConfig, Question, QuizTemplate } from '../types/quiz';
import { QuickAnswerLookup } from './QuickAnswerLookup';
import { Leaderboard } from './Leaderboard';
import { UserStatistics } from './UserStatistics';
import { ChangePasswordModal } from './ChangePasswordModal';
import { supabase } from '../lib/supabase';

interface UserDashboardProps {
  onStartQuiz: (config: QuizConfig) => void;
  questions: Question[];
  loading: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onStartQuiz, questions, loading }) => {
  const { user, logout } = useSimpleAuth();
  const { templates, loadTemplates } = useQuizTemplates();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [customConfig, setCustomConfig] = useState({
    mode: 'practice' as 'practice' | 'exam',
    timeLimit: 60,
    totalQuestions: 20
  });
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [pendingQuizConfig, setPendingQuizConfig] = useState<QuizConfig | null>(null);
  const [confirmMessage, setConfirmMessage] = useState({ title: '', description: '' });

  useEffect(() => {
    const handleQuizCompleted = () => {
      setLeaderboardRefreshTrigger(prev => prev + 1);
      fetchUserRank();
    };

    window.addEventListener('quizCompleted', handleQuizCompleted);
    return () => window.removeEventListener('quizCompleted', handleQuizCompleted);
  }, []);

  useEffect(() => {
    fetchUserRank();
  }, [user, leaderboardRefreshTrigger]);

  const fetchUserRank = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('quiz_rankings')
        .select('rank')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Lỗi khi lấy thứ hạng:', error);
        return;
      }

      setUserRank(data?.rank || null);
    } catch (err) {
      console.error('Lỗi:', err);
    }
  };

  const categories = [...new Set(questions.map(q => q.category))];

  // Sort categories by leading number (extract number from start of string)
  const sortedCategories = categories.sort((a, b) => {
    // Extract leading number from category name
    const matchA = a.match(/^(\d+)/);
    const matchB = b.match(/^(\d+)/);

    const numA = matchA ? parseInt(matchA[1]) : 999999;
    const numB = matchB ? parseInt(matchB[1]) : 999999;

    // Sort by number first
    if (numA !== numB) {
      return numA - numB;
    }

    // If numbers are equal, sort alphabetically
    return a.localeCompare(b);
  });

  const getCategoryStats = (category: string) => {
    const categoryQuestions = questions.filter(q => q.category === category);
    return {
      total: categoryQuestions.length,
      category
    };
  };

  const categoryStats = sortedCategories.map(getCategoryStats);

  const handleCategoryClick = (category: string) => {
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để bắt đầu bài thi. Vui lòng liên hệ quản trị viên.');
      return;
    }

    const categoryQuestions = questions.filter(q => q.category === category);
    const config: QuizConfig = {
      mode: 'practice',
      timeLimit: 60 * 60,
      totalQuestions: categoryQuestions.length,
      categories: { [category]: categoryQuestions.length }
    };

    setConfirmMessage({
      title: 'Bắt đầu ôn luyện?',
      description: `Bạn sắp bắt đầu ôn luyện chuyên đề:\n\n"${category}"\n\n• Số câu hỏi: ${categoryQuestions.length} câu\n• Thời gian: 60 phút\n• Chế độ: Ôn tập (xem đáp án ngay)\n\nBạn có muốn tiếp tục không?`
    });
    setPendingQuizConfig(config);
    setShowStartConfirm(true);
  };

  const handleTemplateClick = (template: QuizTemplate) => {
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để bắt đầu bài thi. Vui lòng liên hệ quản trị viên.');
      return;
    }

    const config: QuizConfig = {
      mode: template.mode,
      timeLimit: template.timeLimit * 60,
      totalQuestions: template.totalQuestions,
      categories: template.categories
    };

    const modeText = template.mode === 'practice' ? 'Ôn tập' : 'Thi thử';
    const modeDesc = template.mode === 'practice'
      ? 'xem đáp án ngay'
      : 'không xem đáp án, nộp bài khi hết giờ';

    setConfirmMessage({
      title: `Bắt đầu ${modeText.toLowerCase()}?`,
      description: `Bạn sắp bắt đầu bộ đề:\n\n"${template.name}"\n\n• Số câu hỏi: ${template.totalQuestions} câu\n• Thời gian: ${template.timeLimit} phút\n• Chế độ: ${modeText} (${modeDesc})\n\nBạn có muốn tiếp tục không?`
    });
    setPendingQuizConfig(config);
    setShowStartConfirm(true);
  };

  const handleConfirmStart = () => {
    if (pendingQuizConfig) {
      console.log('🎯 Starting quiz with config:', pendingQuizConfig);
      onStartQuiz(pendingQuizConfig);
      setShowStartConfirm(false);
      setPendingQuizConfig(null);
    }
  };

  const handleCancelStart = () => {
    setShowStartConfirm(false);
    setPendingQuizConfig(null);
  };

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
    }
  };

  // Reload templates when component mounts
  React.useEffect(() => {
    console.log('🔄 UserDashboard mounted, reloading templates');
    loadTemplates();
  }, [loadTemplates]);
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-[#A50034] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-sm text-white truncate">{user?.full_name || user?.email}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                title="Đổi mật khẩu"
              >
                <Key className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Đổi MK</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Thoát</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {loading ? '...' : questions.length}
              </h3>
              <p className="text-xs text-gray-600">Tổng câu hỏi</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{sortedCategories.length}</h3>
              <p className="text-xs text-gray-600">Chuyên đề</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {userRank ? `#${userRank}` : '-'}
              </h3>
              <p className="text-xs text-gray-600">Thứ hạng</p>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <UserStatistics />

        {/* Leaderboard */}
        <div className="mt-6">
          <Leaderboard refreshTrigger={leaderboardRefreshTrigger} />
        </div>

        {/* Quick Answer Lookup */}
        <div className="mt-6">
          <QuickAnswerLookup questions={questions} />
        </div>

        {/* Category Cards */}
        {categoryStats.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Ôn tập theo chuyên đề
            </h2>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {categoryStats.map((stat, index) => (
                <div
                  key={stat.category}
                  className="border rounded-lg p-2 md:p-3 cursor-pointer transition-all hover:border-blue-400 hover:shadow-md border-gray-200 bg-gradient-to-br from-white to-gray-50"
                  onClick={() => handleCategoryClick(stat.category)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-7 h-7 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                      <span className="text-[#A50034] font-bold text-xs md:text-base">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-[10px] md:text-xs mb-1 line-clamp-3 min-h-[2.5rem] leading-tight">
                      {stat.category}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500">
                      {stat.total} câu
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Templates */}
        {templates.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Thi thử nghiệp vụ
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg p-2 md:p-4 cursor-pointer transition-all hover:border-blue-400 hover:shadow-md border-gray-200"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="mb-2 md:mb-3">
                    <h3 className="font-semibold text-gray-900 text-xs md:text-base text-center md:text-left line-clamp-2 mb-2">{template.name}</h3>

                    {template.description && (
                      <p className="text-gray-600 text-[10px] md:text-sm mb-2 line-clamp-2 hidden md:block">{template.description}</p>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[10px] md:text-sm">
                      <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0 ${
                        template.mode === 'practice'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {template.mode === 'practice' ? '🎯' : '📝'}
                      </span>
                      <div className="flex items-center gap-0.5 md:gap-1 text-gray-500">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{template.timeLimit}p</span>
                      </div>
                      <div className="flex items-center gap-0.5 md:gap-1 text-gray-500">
                        <Target className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{template.totalQuestions}c</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Configuration */}
        {templates.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 mt-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Cấu hình bài thi tùy chỉnh
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chế độ luyện thi
                </label>
                <select
                  value={customConfig.mode}
                  onChange={(e) => setCustomConfig(prev => ({ ...prev, mode: e.target.value as 'practice' | 'exam' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="practice">🎯 Ôn thi (hiện đáp án ngay)</option>
                  <option value="exam">📝 Thi thử (ẩn đáp án)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={customConfig.timeLimit}
                  onChange={(e) => setCustomConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                  min="5"
                  max="180"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số câu hỏi
                </label>
                <input
                  type="number"
                  value={customConfig.totalQuestions}
                  onChange={(e) => setCustomConfig(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 20 }))}
                  min="5"
                  max={Math.min(questions.length, 100)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {templates.length === 0 && questions.length === 0 && !loading && (
          <div className="text-center mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">
              Chưa có câu hỏi nào. Vui lòng liên hệ quản trị viên để thêm câu hỏi.
            </p>
          </div>
        )}
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showStartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmMessage.title}
                  </h3>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {confirmMessage.description}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelStart}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmStart}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Bắt đầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};