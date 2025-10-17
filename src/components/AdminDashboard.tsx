import React, { useState } from 'react';
import { Settings, User, LogOut, Shield, Key, BookOpen, Target, Users as UsersIcon } from 'lucide-react';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useQuizTemplates } from '../hooks/useQuizTemplates';
import { QuizSetup } from './QuizSetup';
import { QuizTemplateManager } from './QuizTemplateManager';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminLeaderboard } from './AdminLeaderboard';
import UserManagement from './UserManagement';
import { QuizConfig, Question } from '../types/quiz';

interface AdminDashboardProps {
  onStartQuiz: (config: QuizConfig) => void;
  questions: Question[];
  loading: boolean;
  error: string | null;
  onQuestionsImport: (questions: Question[], replaceAll?: boolean) => void;
  onClearQuestions: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onStartQuiz,
  questions,
  loading,
  error,
  onQuestionsImport,
  onClearQuestions
}) => {
  const { user, logout } = useSimpleAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    loadTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate
  } = useQuizTemplates();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
    }
  };

  // Reload templates when component mounts
  React.useEffect(() => {
    console.log('🔄 AdminDashboard mounted, reloading templates');
    loadTemplates();
  }, [loadTemplates]);

  const categories = [...new Set(questions.map(q => q.category))];

  // Sort categories by leading number
  const sortedCategories = categories.sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || '999999');
    const numB = parseInt(b.match(/^\d+/)?.[0] || '999999');
    return numA - numB;
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
      alert('Không có câu hỏi nào để bắt đầu bài thi.');
      return;
    }

    const config: QuizConfig = {
      mode: 'practice',
      timeLimit: 60 * 60,
      totalQuestions: questions.filter(q => q.category === category).length,
      categories: { [category]: questions.filter(q => q.category === category).length }
    };

    console.log('🎯 Admin starting quiz from category:', category, config);
    onStartQuiz(config);
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <div className="bg-agribank-primary text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-xl font-semibold truncate">
                  Quản trị Agribank
                </h1>
                <p className="text-xs md:text-sm text-gray-300 hidden sm:block">Quản lý hệ thống luyện thi</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 md:w-4 md:h-4 text-black" />
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-sm">{user?.full_name || user?.email}</p>
                  <p className="text-xs text-yellow-400">Quản trị viên</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Đổi mật khẩu"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Đổi MK</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Chế độ Quản trị:</span>
            <span>Bạn có thể quản lý câu hỏi, cấu hình bài thi và test hệ thống</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="w-4 h-4" />
              Tổng quan & Câu hỏi
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              Quản lý người dùng
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="max-w-4xl mx-auto p-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
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
            </div>

            {categoryStats.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Ôn tập theo chuyên đề
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categoryStats.map(stat => (
                    <div
                      key={stat.category}
                      className="border rounded-lg p-3 cursor-pointer transition-all hover:border-blue-400 hover:shadow-md border-gray-200 bg-gradient-to-br from-white to-gray-50"
                      onClick={() => handleCategoryClick(stat.category)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                          <BookOpen className="w-5 h-5 text-[#A50034]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-xs mb-1 line-clamp-3 min-h-[2.5rem] leading-tight">
                          {stat.category}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {stat.total} câu
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto px-6 pb-6 space-y-6">
            <AdminLeaderboard />

            <QuizTemplateManager
              templates={templates}
              questions={questions}
              loading={templatesLoading}
              error={templatesError}
              onSaveTemplate={async (template) => {
                try {
                  console.log('🔄 AdminDashboard: Saving template:', template);
                  await saveTemplate(template);
                  console.log('✅ AdminDashboard: Template saved successfully');
                  return true;
                } catch (error) {
                  console.error('❌ AdminDashboard: Error in saveTemplate:', error);
                  throw error;
                }
              }}
              onUpdateTemplate={async (id, updates) => {
                try {
                  console.log('🔄 AdminDashboard: Updating template:', id, updates);
                  await updateTemplate(id, updates);
                  console.log('✅ AdminDashboard: Template updated successfully');
                  return true;
                } catch (error) {
                  console.error('❌ AdminDashboard: Error in updateTemplate:', error);
                  throw error;
                }
              }}
              onDeleteTemplate={async (id) => {
                try {
                  console.log('🔄 AdminDashboard: Deleting template:', id);
                  await deleteTemplate(id);
                  console.log('✅ AdminDashboard: Template deleted successfully');
                  return true;
                } catch (error) {
                  console.error('❌ AdminDashboard: Error in deleteTemplate:', error);
                  throw error;
                }
              }}
            />

            <QuizSetup
              questions={questions}
              loading={loading}
              error={error}
              onQuestionsImport={onQuestionsImport}
              onClearQuestions={onClearQuestions}
              onStartQuiz={onStartQuiz}
            />
          </div>
        </>
      ) : (
        <UserManagement />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};