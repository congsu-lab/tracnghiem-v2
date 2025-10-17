import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Kiểm tra xem có cấu hình Supabase thực tế không
export const isSupabaseConfigured = () => {
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey &&
                      supabaseUrl !== 'your_supabase_project_url' &&
                      supabaseAnonKey !== 'your_supabase_anon_key' &&
                      supabaseUrl !== 'https://your-project-id.supabase.co' &&
                      supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' &&
                      supabaseUrl.startsWith('http') &&
                      supabaseUrl.includes('.supabase.co') &&
                      supabaseAnonKey.startsWith('eyJ');
  
  console.log('🔍 Kiểm tra cấu hình Supabase:', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
    isConfigured
  });
  
  return isConfigured;
}

export const supabase = isSupabaseConfigured() && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'sb-quiz-auth-token',
        flowType: 'pkce'
      }
    })
  : null

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          question: string
          options: string[]
          correct_answer: number
          explanation: string | null
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          options: string[]
          correct_answer: number
          explanation?: string | null
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          options?: string[]
          correct_answer?: number
          explanation?: string | null
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      question_sets: {
        Row: {
          id: string
          name: string
          description: string | null
          total_questions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          total_questions: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          total_questions?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}