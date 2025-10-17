/*
  # Tạo lại bảng user_profiles đơn giản
  
  1. Tables
    - `user_profiles` - Lưu thông tin cơ bản của user
      - `id` (uuid, primary key) - ID từ auth.users
      - `email` (text, unique) - Email user
      - `full_name` (text) - Tên đầy đủ
      - `role` (text) - Role: admin hoặc user
      - `created_at` (timestamptz) - Ngày tạo
  
  2. Security
    - Enable RLS
    - Users có thể đọc profile của chính họ
    - Users có thể update profile của chính họ
*/

-- Tạo bảng user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users có thể đọc profile của chính họ
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users có thể update profile của chính họ
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Cho phép insert profile khi đăng ký
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
