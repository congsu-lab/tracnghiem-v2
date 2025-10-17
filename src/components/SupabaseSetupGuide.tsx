import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Database, Settings, Key } from 'lucide-react';

interface SupabaseSetupGuideProps {
  onClose: () => void;
}

export const SupabaseSetupGuide: React.FC<SupabaseSetupGuideProps> = ({ onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const exampleEnv = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Hướng dẫn cấu hình Supabase
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Why Supabase */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">🎯 Tại sao cần Supabase?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800">✅ Lưu trữ vĩnh viễn</h4>
                <p className="text-sm text-green-700">Câu hỏi không bị mất khi tắt trình duyệt</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800">🔄 Đồng bộ</h4>
                <p className="text-sm text-blue-700">Truy cập từ nhiều thiết bị</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-800">💾 Backup tự động</h4>
                <p className="text-sm text-purple-700">An toàn dữ liệu trên cloud</p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800">⚡ Hiệu suất cao</h4>
                <p className="text-sm text-orange-700">Tải nhanh hơn, ít lag</p>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">📋 Bước 1: Tạo tài khoản Supabase</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Truy cập</span>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  supabase.com <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Click <strong>"Start your project"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Đăng ký bằng GitHub hoặc email</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">🏗️ Bước 2: Tạo project mới</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Click <strong>"New Project"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Điền thông tin:</span>
              </div>
              <div className="ml-9 space-y-2 text-sm">
                <div>• <strong>Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">quiz-app</code></div>
                <div>• <strong>Database Password:</strong> Tạo mật khẩu mạnh (lưu lại)</div>
                <div>• <strong>Region:</strong> Singapore (gần Việt Nam nhất)</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Click <strong>"Create new project"</strong> và đợi 2-3 phút</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Bước 3: Lấy API Keys
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Click <Settings className="w-4 h-4 inline mx-1" /> <strong>Settings</strong> trong dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Click <strong>API</strong> trong menu bên trái</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Copy 2 thông tin sau:</span>
              </div>
              <div className="ml-9 space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <strong>Project URL:</strong>
                    <button
                      onClick={() => copyToClipboard('https://your-project-id.supabase.co', 'url')}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedUrl ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-sm bg-white p-2 rounded border block">
                    https://xxxxx.supabase.co
                  </code>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <strong>anon public key:</strong>
                    <button
                      onClick={() => copyToClipboard('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'key')}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedKey ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-sm bg-white p-2 rounded border block break-all">
                    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800">🗄️ Bước 4: Cấu hình file .env</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Mở file <code className="bg-gray-100 px-2 py-1 rounded">.env</code> trong project</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Thay thế các giá trị:</span>
              </div>
              <div className="ml-9">
                <div className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
                  <div className="text-xs leading-relaxed">
                    <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
                    <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">🔄 Bước 5: Restart ứng dụng</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Dừng dev server (Ctrl+C)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Chạy lại: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Mở lại ứng dụng</span>
              </div>
            </div>
          </div>

          {/* Step 6 - Create Table */}
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-red-800">🗄️ Bước 6: Tạo bảng database (QUAN TRỌNG)</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">⚠️ BẮT BUỘC: Tạo bảng questions</h4>
                <p className="text-sm text-red-700">
                  Bạn PHẢI tạo bảng "questions" trong Supabase SQL Editor trước khi sử dụng.
                  Tính năng tự động tạo bảng không hoạt động được.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Vào Supabase Dashboard → <strong>SQL Editor</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Copy SQL script bên dưới</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Paste vào SQL Editor và click <strong>Run</strong></span>
                </div>
              </div>
              
              <div className="ml-3">
                <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-400">-- Copy toàn bộ SQL này</span>
                    <button
                    onClick={() => copyToClipboard(`-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public insert access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public update access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public delete access to questions" ON questions;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public insert access to user_profiles" ON user_profiles;

DROP POLICY IF EXISTS "Allow public read access to active quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to update their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to delete their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Admins can manage all quiz templates" ON quiz_templates;

-- Create or update user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policies for user_profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Create or update questions table
CREATE TABLE IF NOT EXISTS questions (
  id text PRIMARY KEY,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_answer integer NOT NULL,
  explanation text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies for questions (public access for quiz content)
CREATE POLICY "Allow public read access to questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to questions"
  ON questions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to questions"
  ON questions
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to questions"
  ON questions
  FOR DELETE
  TO public
  USING (true);

-- Create or update quiz_templates table
CREATE TABLE IF NOT EXISTS quiz_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  mode text NOT NULL CHECK (mode IN ('practice', 'exam')),
  time_limit integer NOT NULL CHECK (time_limit > 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  categories jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for quiz_templates
ALTER TABLE quiz_templates ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_templates
CREATE POLICY "Allow public read access to active quiz templates"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow creators to insert quiz templates"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow creators to update their quiz templates"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Allow creators to delete their quiz templates"
  ON quiz_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Admin policies for quiz_templates
CREATE POLICY "Admins can manage all quiz templates"
  ON quiz_templates
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for questions
DROP TRIGGER IF EXISTS questions_updated_at ON questions;
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for quiz_templates
DROP TRIGGER IF EXISTS quiz_templates_updated_at ON quiz_templates;
CREATE TRIGGER quiz_templates_updated_at
  BEFORE UPDATE ON quiz_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Create demo accounts (only runs if they don't exist)
DO $$
DECLARE
  admin_user_id uuid;
  regular_user_id uuid;
BEGIN
  -- Create admin user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@demo.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin Demo", "role": "admin"}',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING
  RETURNING id INTO admin_user_id;

  -- Create regular user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user@demo.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "User Demo", "role": "user"}',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING
  RETURNING id INTO regular_user_id;

  -- Insert into user_profiles if the user was newly created or doesn't have a profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, full_name) VALUES
      (admin_user_id, 'admin@demo.com', 'admin', 'Admin Demo')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, full_name = EXCLUDED.full_name;
  END IF;

  IF regular_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, full_name) VALUES
      (regular_user_id, 'user@demo.com', 'user', 'User Demo')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, full_name = EXCLUDED.full_name;
  END IF;

  -- Insert sample quiz templates
  INSERT INTO quiz_templates (name, description, mode, time_limit, total_questions, categories, created_by) VALUES
    (
      'Đề thi Toán - Lý cơ bản',
      'Bộ đề thi dành cho học sinh THPT, tập trung vào Toán học và Vật lý cơ bản',
      'exam',
      90,
      30,
      '{"Toán học": 15, "Vật lý": 10, "Hóa học": 5}',
      (SELECT id FROM auth.users WHERE email = 'admin@demo.com')
    ),
    (
      'Ôn tập Văn - Sử - Địa',
      'Bộ câu hỏi ôn tập cho các môn xã hội, phù hợp cho việc luyện thi',
      'practice',
      60,
      25,
      '{"Văn học": 10, "Lịch sử": 8, "Địa lý": 7}',
      (SELECT id FROM auth.users WHERE email = 'admin@demo.com')
    ),
    (
      'Kiểm tra tổng hợp',
      'Đề thi tổng hợp tất cả các chuyên đề, phù hợp cho đánh giá tổng quát',
      'exam',
      120,
      50,
      '{"Toán học": 10, "Văn học": 8, "Lịch sử": 7, "Địa lý": 7, "Vật lý": 8, "Hóa học": 5, "Sinh học": 5}',
      (SELECT id FROM auth.users WHERE email = 'admin@demo.com')
    )
  ON CONFLICT (id) DO NOTHING;

END $$;

-- Inform completion
SELECT 'All tables, RLS policies, triggers, and demo accounts have been set up successfully!' as message;`, 'url')}
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <div className="text-xs leading-relaxed">
                    <div>-- Tạo bảng questions</div>
                    <div>CREATE TABLE IF NOT EXISTS questions (...);</div>
                    <div className="mt-2">-- Tạo bảng user_profiles</div>
                    <div>CREATE TABLE IF NOT EXISTS user_profiles (...);</div>
                    <div className="mt-2">-- Tạo tài khoản demo</div>
                    <div>INSERT INTO auth.users (...) VALUES (...);</div>
                    <div className="mt-2 text-yellow-400">-- Script đầy đủ trong clipboard</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Đợi thông báo <strong>"All tables, RLS policies, triggers, and demo accounts have been set up successfully!"</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <span>Refresh lại ứng dụng quiz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success indicators */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">✅ Kiểm tra kết nối thành công</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Không còn cảnh báo màu vàng</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Hiển thị "Cơ sở dữ liệu: Đã kết nối"</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Upload câu hỏi sẽ lưu vĩnh viễn</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Mẹo hữu ích:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Free tier:</strong> 500MB storage, 2GB bandwidth/tháng</li>
              <li>• <strong>Backup:</strong> Xuất JSON/Excel thường xuyên</li>
              <li>• <strong>Bảo mật:</strong> Anon key an toàn cho frontend</li>
              <li>• <strong>Quản lý:</strong> Có thể xem/sửa dữ liệu trực tiếp từ Supabase dashboard</li>
            </ul>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Cần hỗ trợ? Liên hệ qua GitHub Issues
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

