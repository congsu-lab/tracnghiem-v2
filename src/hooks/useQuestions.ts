import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Question } from '../types/quiz';
import { sampleQuestions } from '../data/sampleQuestions';
import { convertExcelDatesInText, convertExcelDatesInOptions } from '../utils/dateConverter';

// Function to create table if it doesn't exist
const createQuestionsTable = async () => {
  if (!supabase) return false;
  
  try {
    // Không thể tự động tạo bảng, chỉ log warning
    console.warn('⚠️ Bảng questions chưa tồn tại. Vui lòng tạo bảng thủ công trong Supabase SQL Editor.');
    return false;
  } catch (err) {
    console.warn('⚠️ Không thể kiểm tra bảng questions:', err);
    return false;
  }
};

// Function to check if table exists
const checkTableExists = async () => {
  if (!supabase) return false;
  
  try {
    // Timeout cho table check
    const checkPromise = supabase
      .from('questions')
      .select('count', { count: 'exact', head: true });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Table check timeout')), 5000);
    });
    
    const { error } = await Promise.race([checkPromise, timeoutPromise]) as any;
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('Could not find the table')) {
        return false; // Bảng không tồn tại
      }
      if (error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout khi kiểm tra bảng');
        return false;
      }
      // Các lỗi khác có thể là do permission, coi như bảng tồn tại
      return true;
    }
    
    return true; // Bảng tồn tại
  } catch (err) {
    console.warn('⚠️ Lỗi khi kiểm tra bảng:', err);
    return false;
  }
};

// Function to ensure table exists, create if needed
const ensureTableExists = async () => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    const created = await createQuestionsTable();
    if (created) {
      // Wait a moment for the table to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return created;
  }
  return true;
};

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // Load questions from database (wrapped in useCallback to prevent infinite loops)
  const loadQuestions = useCallback(async () => {
    console.log('🔄 loadQuestions: Bắt đầu tải câu hỏi...');
    console.log('🔍 Categories found:', [...new Set(questions.map(q => q.category))]);
    
    // Nếu chưa cấu hình Supabase, không load được dữ liệu
    if (!isSupabaseConfigured() || !supabase) {
      console.log('⚠️ loadQuestions: Chưa cấu hình Supabase');
      setQuestions([]);
      setLoading(false);
      setError('⚠️ Chưa cấu hình Supabase. Vui lòng cấu hình để sử dụng.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 loadQuestions: Đang kiểm tra bảng questions...');
      
      // Kiểm tra bảng có tồn tại không với timeout ngắn
      const tableExists = await Promise.race([
        checkTableExists(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]).catch(err => {
        console.warn('⚠️ Timeout hoặc lỗi khi kiểm tra bảng:', err);
        return false;
      });
      
      if (!tableExists) {
        console.warn('❌ loadQuestions: Bảng questions chưa tồn tại');
        setError('❌ Bảng "questions" chưa tồn tại trong database.\n\n🔧 Cách khắc phục:\n1. Vào Supabase Dashboard → SQL Editor\n2. Copy script tạo bảng từ hướng dẫn\n3. Paste và click Run\n4. Refresh lại trang này');
        setQuestions([]);
        setLoading(false);
        return;
      }
      
      console.log('🔄 loadQuestions: Đang truy vấn dữ liệu từ Supabase...');

      // Query với timeout
      const countPromise = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { count: totalCount, error: countError } = await Promise.race([
        countPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 5000))
      ]) as any;

      if (countError) {
        console.warn('⚠️ Không thể đếm tổng số câu hỏi:', countError);
      } else {
        console.log('📊 Tổng số câu hỏi trong DB:', totalCount);
      }

      // Fetch tất cả dữ liệu bằng pagination
      let allData: any[] = [];
      const PAGE_SIZE = 1000;
      let currentPage = 0;
      let hasMore = true;

      while (hasMore) {
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        console.log(`🔄 Đang tải trang ${currentPage + 1} (từ ${from} đến ${to})...`);

        const queryPromise = supabase
          .from('questions')
          .select('*')
          .range(from, to)
          .order('created_at', { ascending: false });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 30000);
        });

        const { data: pageData, error: pageError } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (pageError) {
          console.error(`❌ Lỗi khi tải trang ${currentPage + 1}:`, pageError);
          throw pageError;
        }

        if (pageData && pageData.length > 0) {
          allData = [...allData, ...pageData];
          console.log(`✅ Đã tải ${allData.length} câu hỏi`);

          if (pageData.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      const data = allData;
      const error = null;

      console.log('🔄 loadQuestions: Kết quả truy vấn:', {
        dataLength: data?.length,
        totalCount: totalCount || 'unknown',
        pagesLoaded: currentPage + 1,
        status: 'Loaded all questions successfully'
      });

      if (error) {
        console.error('❌ loadQuestions: Lỗi từ Supabase:', error);
        
        if (error.message?.includes('timeout')) {
          setError('⏱️ Timeout khi tải câu hỏi. Kiểm tra kết nối mạng.');
          setQuestions([]);
          setLoading(false);
          return;
        }

        if (error.code === 'PGRST116' || error.message?.includes('Could not find the table')) {
          setError('❌ Bảng "questions" chưa tồn tại.\n\n🔧 Để sửa lỗi này:\n1. Mở Supabase Dashboard\n2. Vào SQL Editor\n3. Chạy script tạo bảng\n4. Refresh ứng dụng');
          setQuestions([]);
          setLoading(false);
          return;
        }
        
        throw error;
      }

      const formattedQuestions: Question[] = data.map(row => ({
        id: row.id,
        question: convertExcelDatesInText(row.question),
        options: convertExcelDatesInOptions(row.options),
        correctAnswer: row.correct_answer,
        explanation: convertExcelDatesInText(row.explanation || ''),
        category: row.category
      }));

      console.log('✅ loadQuestions: Đã format thành công', formattedQuestions.length, 'câu hỏi');
      setQuestions(formattedQuestions);
    } catch (err) {
      console.error('❌ loadQuestions: Lỗi không mong muốn:', err);
      
      let errorMessage = 'Lỗi tải câu hỏi';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = '⏱️ Kết nối chậm. Sử dụng câu hỏi mẫu.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = '🌐 Lỗi mạng. Sử dụng câu hỏi mẫu.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      // Không load được dữ liệu
      setQuestions([]);
    } finally {
      setLoading(false);
      console.log('✅ loadQuestions: Hoàn thành');
    }
  }, []);

  // Save questions to database
  const saveQuestions = useCallback(async (newQuestions: Question[]) => {
    console.log('🔄 saveQuestions: Bắt đầu lưu', newQuestions.length, 'câu hỏi');
    
    // Nếu chưa cấu hình Supabase, chỉ lưu local
    if (!isSupabaseConfigured() || !supabase) {
      console.log('⚠️ saveQuestions: Chưa cấu hình Supabase, lưu local');
      setQuestions(newQuestions);
      setError('⚠️ Chưa cấu hình Supabase. Câu hỏi chỉ lưu tạm thời trong phiên làm việc này.');
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 saveQuestions: Đang kiểm tra bảng...');
      
      // Kiểm tra bảng với timeout
      const tableExists = await Promise.race([
        checkTableExists(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]).catch(() => false);
      
      if (!tableExists) {
        setError('❌ Không thể lưu: Database chưa sẵn sàng.\n\n🛠️ Cần làm:\n1. Cấu hình Supabase database\n2. Tạo bảng "questions"\n3. Thử lại');
        return false;
      }
      
      // Convert to database format
      const dbQuestions = newQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation || null,
        category: q.category
      }));

      console.log('🔄 saveQuestions: Đang xóa câu hỏi cũ...');
      
      // Clear existing questions với timeout
      const deletePromise = supabase
        .from('questions')
        .delete()
        .neq('id', '');
      
      const { error: deleteError } = await Promise.race([
        deletePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 15000))
      ]) as any;

      if (deleteError) throw deleteError;

      console.log('🔄 saveQuestions: Đang thêm câu hỏi mới...');

      const BATCH_SIZE = 100;
      let successCount = 0;
      const totalBatches = Math.ceil(dbQuestions.length / BATCH_SIZE);

      for (let i = 0; i < dbQuestions.length; i += BATCH_SIZE) {
        const batch = dbQuestions.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const progress = Math.round((successCount / dbQuestions.length) * 100);
        console.log(`🔄 saveQuestions: Batch ${batchNum}/${totalBatches} (${batch.length} câu) - ${progress}%`);

        const insertPromise = supabase
          .from('questions')
          .insert(batch);

        const { error: insertError } = await Promise.race([
          insertPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Insert timeout')), 120000))
        ]) as any;

        if (insertError) {
          if (insertError.code === 'PGRST116' || insertError.message?.includes('Could not find the table')) {
            setError('❌ Bảng "questions" chưa tồn tại. Vui lòng tạo bảng theo hướng dẫn.');
            return false;
          }
          console.error(`❌ Lỗi batch ${batchNum}:`, insertError);
          throw insertError;
        }

        successCount += batch.length;
        console.log(`✅ Đã lưu ${successCount}/${dbQuestions.length} câu (${progress}%)`);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ saveQuestions: Lưu thành công tất cả', successCount, 'câu hỏi');
      setQuestions(newQuestions);
      return true;
    } catch (err) {
      console.error('❌ saveQuestions: Lỗi:', err);
      
      let errorMessage = 'Lỗi lưu câu hỏi';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = '⏱️ Timeout khi lưu. Thử lại sau.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add questions (append to existing)
  const addQuestions = useCallback(async (newQuestions: Question[]) => {
    console.log('🔄 addQuestions: Bắt đầu thêm', newQuestions.length, 'câu hỏi');

    // Nếu chưa cấu hình Supabase, chỉ thêm local
    if (!isSupabaseConfigured() || !supabase) {
      console.log('⚠️ addQuestions: Chưa cấu hình Supabase, thêm local');
      setQuestions(prev => [...prev, ...newQuestions]);
      setError('⚠️ Chưa cấu hình Supabase. Câu hỏi chỉ lưu tạm thời trong phiên làm việc này.');
      return true;
    }

    setLoading(true);
    setError(null);

    // Set timeout dài hơn cho việc import nhiều câu hỏi (15 phút)
    const timeout = setTimeout(() => {
      console.warn('⚠️ addQuestions: Timeout sau 15 phút');
      setLoading(false);
      setError('Timeout khi thêm câu hỏi. Có thể do số lượng câu hỏi quá lớn. Vui lòng thử lại hoặc chia nhỏ file.');
    }, 900000);

    try {
      console.log('🔄 addQuestions: Đang kiểm tra bảng...');
      // Ensure table exists first
      const tableExists = await ensureTableExists();
      if (!tableExists) {
        setError('❌ Không thể thêm câu hỏi: Bảng "questions" chưa tồn tại.\n\n📋 Hướng dẫn tạo bảng:\n1. Truy cập Supabase Dashboard\n2. Mở SQL Editor\n3. Chạy script tạo bảng questions\n4. Thử upload lại');
        return false;
      }
      
      const dbQuestions = newQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation || null,
        category: q.category
      }));

      console.log('🔄 addQuestions: Đang thêm vào database...');

      // Giảm batch size để import nhanh hơn và tránh timeout
      const BATCH_SIZE = 50;
      let successCount = 0;
      const totalBatches = Math.ceil(dbQuestions.length / BATCH_SIZE);

      // Keepalive session mỗi 100 batch
      let batchCounter = 0;

      for (let i = 0; i < dbQuestions.length; i += BATCH_SIZE) {
        const batch = dbQuestions.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const progress = Math.round((successCount / dbQuestions.length) * 100);
        console.log(`🔄 addQuestions: Batch ${batchNum}/${totalBatches} (${batch.length} câu) - ${progress}%`);

        const insertPromise = supabase
          .from('questions')
          .insert(batch);

        const { error } = await Promise.race([
          insertPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Insert timeout')), 60000))
        ]) as any;

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
            setError('❌ Upload thất bại: Bảng "questions" chưa được tạo.\n\n⚡ Giải pháp nhanh:\n1. Click nút "Hướng dẫn" để xem chi tiết\n2. Tạo bảng trong Supabase SQL Editor\n3. Upload lại file Excel');
            return false;
          }
          console.error(`❌ Lỗi batch ${batchNum}:`, error);
          throw error;
        }

        successCount += batch.length;
        console.log(`✅ Đã thêm ${successCount}/${dbQuestions.length} câu (${progress}%)`);

        // Refresh session mỗi 100 batch để tránh timeout
        batchCounter++;
        if (batchCounter % 100 === 0) {
          console.log('🔄 Refreshing session...');
          await supabase.auth.refreshSession().catch(err => {
            console.warn('⚠️ Session refresh failed:', err);
          });
        }

        // Không delay để import nhanh hơn
        // await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ addQuestions: Thêm thành công tất cả', successCount, 'câu hỏi');
      setQuestions(prev => [...prev, ...newQuestions]);
      clearTimeout(timeout);
      return true;
    } catch (err) {
      console.error('❌ addQuestions: Lỗi:', err);
      setError(err instanceof Error ? err.message : 'Lỗi thêm câu hỏi');
      clearTimeout(timeout);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete all questions
  const clearQuestions = useCallback(async () => {
    console.log('🔄 clearQuestions: Bắt đầu xóa tất cả câu hỏi');
    
    // Nếu chưa cấu hình Supabase, chỉ xóa local
    if (!isSupabaseConfigured() || !supabase) {
      console.log('⚠️ clearQuestions: Chưa cấu hình Supabase, xóa local');
      setQuestions([]);
      return true;
    }

    setLoading(true);
    setError(null);
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.warn('⚠️ clearQuestions: Timeout sau 10 giây');
      setLoading(false);
      setError('Timeout khi xóa câu hỏi. Vui lòng thử lại.');
    }, 10000);

    try {
      console.log('🔄 clearQuestions: Đang kiểm tra bảng...');
      // Check if table exists, if not try to create it
      const tableExists = await checkTableExists();
      if (!tableExists) {
        const created = await createQuestionsTable();
        if (!created) {
          setError('❌ Bảng "questions" chưa tồn tại và không thể tự động tạo. Vui lòng tạo bảng thủ công trong Supabase SQL Editor.');
          clearTimeout(timeout);
          return false;
        }
        // Wait a moment for the table to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('🔄 clearQuestions: Đang xóa dữ liệu...');
      const { error } = await supabase
        .from('questions')
        .delete()
        .neq('id', ''); // Delete all

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
          setError('❌ Bảng "questions" chưa tồn tại. Vui lòng tạo bảng trong Supabase SQL Editor theo hướng dẫn.');
          clearTimeout(timeout);
          return false;
        }
        throw error;
      }

      console.log('✅ clearQuestions: Xóa thành công');
      setQuestions([]);
      clearTimeout(timeout);
      return true;
    } catch (err) {
      console.error('❌ clearQuestions: Lỗi:', err);
      setError(err instanceof Error ? err.message : 'Lỗi xóa câu hỏi');
      clearTimeout(timeout);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load questions on mount
  useEffect(() => {
    console.log('🔄 useQuestions: Component mounted, bắt đầu load questions');
    loadQuestions();
  }, []);

  return {
    questions,
    loading,
    error,
    isSupabaseConfigured: isSupabaseConfigured(),
    loadQuestions,
    saveQuestions,
    addQuestions,
    clearQuestions
  };
};