import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QuizTemplate } from '../types/quiz';
import { useAuth } from './useAuth';

export const useQuizTemplates = () => {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Retry logic with exponential backoff
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: any = null;

      while (retryCount < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const { data, error: queryError } = await supabase
            .from('quiz_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);

          if (queryError) {
            throw queryError;
          }

          // Convert database snake_case to camelCase
          const formattedTemplates = (data || []).map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            mode: template.mode,
            timeLimit: template.time_limit || 60, // Convert time_limit to timeLimit
            totalQuestions: template.total_questions || 20, // Convert total_questions to totalQuestions
            categories: template.categories || {},
            isActive: template.is_active,
            createdBy: template.created_by,
            createdAt: template.created_at,
            updatedAt: template.updated_at
          }));
          
          console.log('🔄 Formatted templates:', formattedTemplates);
          setTemplates(formattedTemplates);
          setError(null);
          return; // Success, exit retry loop

        } catch (err: any) {
          lastError = err;
          retryCount++;
          
          // Don't retry on certain errors
          if (err.name === 'AbortError') {
            throw new Error('Kết nối timeout. Vui lòng kiểm tra kết nối mạng.');
          }
          
          if (err.code === 'PGRST116' || err.message?.includes('relation') || err.message?.includes('does not exist')) {
            throw new Error('Bảng quiz_templates chưa được tạo. Vui lòng chạy SQL script trong hướng dẫn Supabase.');
          }

          if (err.code === '42501' || err.message?.includes('permission denied')) {
            throw new Error('Lỗi phân quyền. Vui lòng kiểm tra RLS policies trong Supabase.');
          }

          // Wait before retry (exponential backoff)
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      // All retries failed
      throw lastError || new Error('Không thể tải danh sách đề thi sau nhiều lần thử.');

    } catch (err: any) {
      console.error('Error loading quiz templates:', err);
      let errorMessage = 'Không thể tải danh sách đề thi';
      
      if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra:\n• Kết nối internet\n• Cấu hình Supabase URL/Key trong file .env\n• Supabase project có đang hoạt động';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTemplate = useCallback(async (template: Omit<QuizTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) {
        throw new Error('Bạn cần đăng nhập để tạo đề thi');
      }

      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([{
          ...template,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      await loadTemplates();
      return data;
    } catch (err: any) {
      console.error('Error creating template:', err);
      throw err;
    }
  }, [user, loadTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<QuizTemplate>) => {
    try {
      if (!user) {
        throw new Error('Bạn cần đăng nhập để cập nhật đề thi');
      }

      console.log('🔄 Updating template:', id, 'with updates:', updates);
      
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {};
      
      // Map each field explicitly
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.mode !== undefined) dbUpdates.mode = updates.mode;
      if (updates.timeLimit !== undefined) {
        // Đảm bảo timeLimit được convert đúng sang time_limit
        const timeValue = typeof updates.timeLimit === 'string' ? parseInt(updates.timeLimit) : updates.timeLimit;
        dbUpdates.time_limit = isNaN(timeValue) ? 60 : timeValue;
        console.log('🔄 Setting time_limit to:', updates.timeLimit);
      }
      if (updates.totalQuestions !== undefined) {
        // Đảm bảo totalQuestions được convert đúng sang total_questions
        const questionsValue = typeof updates.totalQuestions === 'string' ? parseInt(updates.totalQuestions) : updates.totalQuestions;
        dbUpdates.total_questions = isNaN(questionsValue) ? 20 : questionsValue;
        console.log('🔄 Setting total_questions to:', updates.totalQuestions);
      }
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.createdBy !== undefined) dbUpdates.created_by = updates.createdBy;
      
      // Always update timestamp
      dbUpdates.updated_at = new Date().toISOString();
      
      console.log('🔄 Database updates:', dbUpdates);

      // Try multiple approaches for better compatibility
      let updateResult;
      let updateError;
      
      // Method 1: Standard update
      try {
        updateResult = await supabase
          .from('quiz_templates')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
          
        if (updateResult.error) throw updateResult.error;
        console.log('✅ Standard update successful:', updateResult.data);
        
      } catch (err) {
        console.warn('⚠️ Standard update failed:', err);
        updateError = err;
        
        // Method 2: Update without select
        try {
          const simpleUpdate = await supabase
            .from('quiz_templates')
            .update(dbUpdates)
            .eq('id', id);
            
          if (simpleUpdate.error) throw simpleUpdate.error;
          
          // Get updated data separately
          const { data: updatedData, error: selectError } = await supabase
            .from('quiz_templates')
            .select('*')
            .eq('id', id)
            .single();
            
          if (selectError) throw selectError;
          
          updateResult = { data: updatedData, error: null };
          console.log('✅ Simple update + select successful:', updatedData);
          
        } catch (err2) {
          console.warn('⚠️ Simple update also failed:', err2);
          
          // Method 3: Force update using RPC if available
          try {
            const rpcResult = await supabase.rpc('update_quiz_template', {
              template_id: id,
              updates: dbUpdates
            });
            
            if (rpcResult.error) throw rpcResult.error;
            console.log('✅ RPC update successful');
            
            // Reload data after RPC
            await loadTemplates();
            return true;
            
          } catch (err3) {
            console.error('❌ All update methods failed:', { err, err2, err3 });
            throw updateError || err;
          }
        }
      }
      
      if (updateResult?.error) {
        console.error('❌ Update failed with error:', updateResult.error);
        throw updateResult.error;
      }

      console.log('✅ Template updated successfully');
      await loadTemplates();
      return true;
      
    } catch (err: any) {
      console.error('❌ updateTemplate error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Không thể cập nhật bộ đề thi';
      
      if (err.message?.includes('permission denied') || err.code === '42501') {
        errorMessage = '❌ Không có quyền cập nhật bộ đề thi này. Chỉ người tạo hoặc admin mới có thể cập nhật.';
      } else if (err.message?.includes('Could not find') || err.code === 'PGRST204') {
        errorMessage = '❌ Lỗi cấu trúc database. Vui lòng kiểm tra bảng quiz_templates trong Supabase.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = '⏱️ Timeout khi cập nhật. Vui lòng thử lại.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = '🌐 Lỗi kết nối mạng. Kiểm tra internet và thử lại.';
      }
      
      throw new Error(errorMessage);
    }
  }, [user, loadTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      if (!user) {
        throw new Error('Bạn cần đăng nhập để xóa đề thi');
      }

      console.log('🔄 Attempting to delete template:', id);
      
      // Method 1: Try RPC function first (bypasses RLS)
      try {
        const rpcResult = await supabase.rpc('delete_quiz_template', {
          template_id: id
        });
        
        if (rpcResult.error) {
          console.warn('⚠️ RPC delete failed:', rpcResult.error);
          throw rpcResult.error;
        }
        
        const result = rpcResult.data;
        if (result && !result.success) {
          throw new Error(result.error || 'RPC delete failed');
        }
        
        console.log('✅ RPC delete successful:', result);
        await loadTemplates();
        return true;
        
      } catch (rpcError) {
        console.warn('⚠️ RPC delete failed, trying soft delete:', rpcError);
        
        // Method 2: Soft delete (set is_active = false)
        try {
          const softDeleteResult = await supabase
            .from('quiz_templates')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (softDeleteResult.error) {
            console.warn('⚠️ Soft delete failed:', softDeleteResult.error);
            throw softDeleteResult.error;
          }
          
          console.log('✅ Soft delete successful');
          await loadTemplates();
          return true;
          
        } catch (softError) {
          console.warn('⚠️ Soft delete failed, trying hard delete:', softError);
          
          // Method 3: Hard delete as final fallback
          try {
            const hardDeleteResult = await supabase
              .from('quiz_templates')
              .delete()
              .eq('id', id);
              
            if (hardDeleteResult.error) {
              console.error('❌ Hard delete also failed:', hardDeleteResult.error);
              throw hardDeleteResult.error;
            }
            
            console.log('✅ Hard delete successful');
            await loadTemplates();
            return true;
            
          } catch (hardError) {
            console.error('❌ All delete methods failed:', { rpcError, softError, hardError });
            throw rpcError; // Throw the original RPC error
          }
        }
      }
      
    } catch (err: any) {
      console.error('❌ deleteTemplate error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Không thể xóa bộ đề thi';
      
      if (err.message?.includes('permission denied') || err.code === '42501') {
        errorMessage = '❌ Không có quyền xóa bộ đề thi này. Chỉ người tạo hoặc admin mới có thể xóa.';
      } else if (err.message?.includes('Could not find') || err.code === 'PGRST204') {
        errorMessage = '❌ Lỗi cấu trúc database. Vui lòng kiểm tra bảng quiz_templates trong Supabase.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = '⏱️ Timeout khi xóa. Vui lòng thử lại.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = '🌐 Lỗi kết nối mạng. Kiểm tra internet và thử lại.';
      }
      
      throw new Error(errorMessage);
    }
  }, [user, loadTemplates]);

  const saveTemplate = useCallback(async (template: Omit<QuizTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) {
        throw new Error('Bạn cần đăng nhập để tạo đề thi');
      }

      console.log('🔄 Creating new template:', template.name);

      // Convert camelCase to snake_case for database
      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([{
          name: template.name,
          description: template.description,
          mode: template.mode,
          time_limit: typeof template.timeLimit === 'string' ? parseInt(template.timeLimit) : template.timeLimit,
          total_questions: typeof template.totalQuestions === 'string' ? parseInt(template.totalQuestions) : template.totalQuestions,
          categories: template.categories,
          is_active: template.isActive,
          created_by: template.createdBy
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Create template failed:', error);
        throw new Error(`Không thể tạo bộ đề thi: ${error.message}`);
      }

      console.log('✅ Template created successfully:', data);
      await loadTemplates();
      return true;
    } catch (err: any) {
      console.error('Error creating template:', err);
      throw err;
    }
  }, [user, loadTemplates]);

  // Debounced reload function
  const reloadTemplates = useCallback(() => {
    const timeoutId = setTimeout(() => {
      loadTemplates();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    reloadTemplates
  };
};