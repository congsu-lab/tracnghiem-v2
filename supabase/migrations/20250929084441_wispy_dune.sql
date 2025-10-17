/*
  # Sửa lỗi Database error querying schema

  1. Xóa tất cả policies cũ để tránh xung đột
  2. Tạo lại bảng với cấu trúc đúng
  3. Thiết lập RLS policies nhất quán
  4. Tạo tài khoản demo với cấu trúc đúng
  5. Thêm triggers và functions cần thiết
*/

-- Drop existing policies to ensure a clean slate
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
SELECT 'All tables, RLS policies, triggers, and demo accounts have been set up successfully!' as message;