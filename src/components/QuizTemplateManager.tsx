import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, BookOpen, Clock, Target } from 'lucide-react';
import { QuizTemplate, Question } from '../types/quiz';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface QuizTemplateManagerProps {
  templates: QuizTemplate[];
  questions: Question[];
  loading: boolean;
  error: string | null;
  onSaveTemplate: (template: Omit<QuizTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateTemplate: (id: string, updates: Partial<QuizTemplate>) => Promise<boolean>;
  onDeleteTemplate: (id: string) => Promise<boolean>;
}

export const QuizTemplateManager: React.FC<QuizTemplateManagerProps> = ({
  templates,
  questions,
  loading,
  error,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}) => {
  const { user } = useSimpleAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'practice' as 'practice' | 'exam',
    timeLimit: 60,
    totalQuestions: 20,
    categories: {} as { [key: string]: number }
  });

  const categories = [...new Set(questions.map(q => q.category))];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mode: 'practice',
      timeLimit: 60,
      totalQuestions: 20,
      categories: {}
    });
    setShowCreateForm(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate categories exist
    const invalidCategories = Object.keys(formData.categories).filter(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      return categoryQuestions.length === 0;
    });
    
    if (invalidCategories.length > 0) {
      alert(`⚠️ Các chuyên đề sau không tồn tại hoặc không có câu hỏi:\n${invalidCategories.join('\n')}\n\nVui lòng kiểm tra lại tên chuyên đề.`);
      return;
    }
    const totalSelectedQuestions = Object.values(formData.categories).reduce((sum, count) => sum + count, 0);
    
    if (totalSelectedQuestions > formData.totalQuestions) {
      alert('Tổng số câu hỏi theo chuyên đề không được vượt quá tổng số câu hỏi!');
      return;
    }

    // Validate each category has enough questions
    const insufficientCategories = Object.entries(formData.categories).filter(([category, count]) => {
      const categoryQuestions = questions.filter(q => q.category === category);
      return count > categoryQuestions.length;
    });
    
    if (insufficientCategories.length > 0) {
      const errorMsg = insufficientCategories.map(([cat, count]) => {
        const available = questions.filter(q => q.category === cat).length;
        return `• ${cat}: Yêu cầu ${count} câu, chỉ có ${available} câu`;
      }).join('\n');
      
      alert(`⚠️ Một số chuyên đề không đủ câu hỏi:\n\n${errorMsg}\n\nVui lòng giảm số câu hỏi hoặc thêm câu hỏi cho các chuyên đề này.`);
      return;
    }
    
    // Show loading state
    const originalButtonText = e.currentTarget.querySelector('button[type="submit"]')?.textContent;
    const submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = editingTemplate ? 'Đang cập nhật...' : 'Đang tạo...';
    }
    
    // Đảm bảo timeLimit và totalQuestions là số
    const timeLimit = typeof formData.timeLimit === 'string' ? parseInt(formData.timeLimit) || 60 : formData.timeLimit;
    const totalQuestions = typeof formData.totalQuestions === 'string' ? parseInt(formData.totalQuestions) || 20 : formData.totalQuestions;
    
    const templateData = {
      name: formData.name,
      description: formData.description,
      mode: formData.mode,
      timeLimit: timeLimit,
      totalQuestions: totalQuestions,
      categories: formData.categories,
      isActive: true,
      createdBy: user.id
    };

    try {
      console.log('🔄 Submitting template data:', {
        ...templateData,
        timeLimit: `${templateData.timeLimit} (${typeof templateData.timeLimit})`,
        totalQuestions: `${templateData.totalQuestions} (${typeof templateData.totalQuestions})`
      });
      
      let success = false;
      if (editingTemplate) {
        console.log('🔄 Updating existing template:', editingTemplate.id);
        success = await onUpdateTemplate(editingTemplate.id, templateData);
      } else {
        console.log('🔄 Creating new template');
        success = await onSaveTemplate(templateData);
      }

      if (success) {
        alert(editingTemplate ? '✅ Cập nhật bộ đề thi thành công!' : '✅ Tạo bộ đề thi thành công!');
        resetForm();
      } else {
        alert('❌ Có lỗi xảy ra. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('❌ Template submission error:', error);
      alert(`❌ Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`);
      
    } finally {
      // Restore button state
      if (submitButton && originalButtonText) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  };

  const handleEdit = (template: QuizTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      mode: template.mode,
      timeLimit: template.timeLimit,
      totalQuestions: template.totalQuestions,
      categories: template.categories
    });
    setEditingTemplate(template);
    setShowCreateForm(true);
  };

  const handleDelete = async (template: QuizTemplate) => {
    const confirmMessage = `⚠️ Bạn có chắc chắn muốn xóa bộ đề thi "${template.name}"?\n\n` +
      `📋 Thông tin:\n` +
      `• Tên: ${template.name}\n` +
      `• Chế độ: ${template.mode === 'practice' ? 'Ôn thi' : 'Thi thử'}\n` +
      `• Thời gian: ${template.timeLimit} phút\n` +
      `• Số câu: ${template.totalQuestions}\n\n` +
      `❗ Hành động này không thể hoàn tác!`;
      
    if (window.confirm(confirmMessage)) {
      // Find delete button and show loading
      const deleteButtons = document.querySelectorAll('button[title="Xóa"]');
      let deleteButton: HTMLButtonElement | null = null;
      
      deleteButtons.forEach(btn => {
        const templateCard = btn.closest('.border');
        if (templateCard?.textContent?.includes(template.name)) {
          deleteButton = btn as HTMLButtonElement;
        }
      });
      
      if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>';
      }
      
      try {
        console.log('🔄 Đang xóa template:', template.id, template.name);
        const success = await onDeleteTemplate(template.id);
        
        if (success) {
          alert('✅ Xóa bộ đề thi thành công!');
        } else {
          alert('❌ Không thể xóa bộ đề thi. Vui lòng thử lại.');
        }
        
      } catch (error) {
        console.error('❌ Lỗi khi xóa template:', error);
        alert(`❌ Lỗi khi xóa bộ đề thi:\n\n${error instanceof Error ? error.message : 'Lỗi không xác định'}\n\nVui lòng thử lại hoặc liên hệ admin.`);
        
      } finally {
        // Restore delete button
        if (deleteButton) {
          deleteButton.disabled = false;
          deleteButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        }
      }
    }
  };

  const updateCategoryCount = (category: string, count: number) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: count
      }
    }));
  };

  const totalSelectedQuestions = Object.values(formData.categories).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Quản lý Bộ đề thi
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo bộ đề mới
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {editingTemplate ? 'Chỉnh sửa bộ đề thi' : 'Tạo bộ đề thi mới'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên bộ đề thi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Đề thi Toán - Lý cơ bản"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chế độ
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as 'practice' | 'exam' }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  min="5"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: 60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian tối thiểu 5 phút
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tổng số câu hỏi
                </label>
                <input
                  type="number"
                  min="1"
                  max={questions.length}
                  value={formData.totalQuestions}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 20 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: 200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số câu hỏi từ 1 đến {questions.length} câu
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả ngắn về bộ đề thi này..."
              />
            </div>

            {/* Category Selection */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phân bổ câu hỏi theo chuyên đề
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(category => {
                    const categoryQuestions = questions.filter(q => q.category === category);
                    return (
                      <div key={category} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 break-words leading-tight" title={category}>
                          {category}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">Có sẵn: {categoryQuestions.length} câu</p>
                        <input
                          type="number"
                          placeholder="Số câu"
                          min="0"
                          max={categoryQuestions.length}
                          value={formData.categories[category] || ''}
                          onChange={(e) => updateCategoryCount(category, parseInt(e.target.value) || 0)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Đã chọn: <strong>{totalSelectedQuestions}</strong> câu từ các chuyên đề
                    {totalSelectedQuestions > 0 && totalSelectedQuestions !== formData.totalQuestions && (
                      <span className="text-blue-600">
                        {' '}(Sẽ lấy thêm {formData.totalQuestions - totalSelectedQuestions} câu ngẫu nhiên)
                      </span>
                    )}
                  </p>
                  {totalSelectedQuestions > formData.totalQuestions && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ Tổng câu hỏi theo chuyên đề ({totalSelectedQuestions}) vượt quá tổng số câu hỏi ({formData.totalQuestions})
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingTemplate ? 'Cập nhật' : 'Tạo bộ đề'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Đang tải bộ đề thi...</p>
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Chưa có bộ đề thi nào. Hãy tạo bộ đề đầu tiên!</p>
          </div>
        )}

        {templates.map(template => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.mode === 'practice' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {template.mode === 'practice' ? '🎯 Ôn thi' : '📝 Thi thử'}
                  </span>
                </div>
                
                {template.description && (
                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{template.timeLimit} phút</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{template.totalQuestions} câu</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{Object.keys(template.categories).length} chuyên đề</span>
                  </div>
                </div>

                {Object.keys(template.categories).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Phân bổ theo chuyên đề:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(template.categories).map(([category, count]) => (
                        <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {category}: {count} câu
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};