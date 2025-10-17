# Hướng dẫn tạo bảng questions trong Supabase SQL Editor

## 🎯 Mục tiêu
Tạo bảng `questions` trong Supabase để lưu trữ câu hỏi trắc nghiệm vĩnh viễn.

## 📋 Bước 1: Truy cập Supabase Dashboard

1. **Mở trình duyệt** và truy cập [supabase.com](https://supabase.com)
2. **Đăng nhập** vào tài khoản của bạn
3. **Chọn project** quiz-app (hoặc tên project bạn đã tạo)
4. Đợi dashboard load hoàn tất

## 🔧 Bước 2: Mở SQL Editor

1. Trong dashboard, tìm menu bên trái
2. Click vào **"SQL Editor"** (biểu tượng </> hoặc database)
3. Sẽ mở ra giao diện SQL Editor với khung soạn thảo

## 📝 Bước 3: Copy SQL Script

**Copy toàn bộ đoạn SQL sau:**

```sql
-- Tạo bảng user_profiles trước để tránh lỗi dependency
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tạo bảng questions để lưu trữ câu hỏi trắc nghiệm
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

-- Bật Row Level Security (RLS) cho bảo mật
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- XÓA CÁC POLICY CŨ TRƯỚC (nếu đã tồn tại)
DROP POLICY IF EXISTS "Allow public read access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public insert access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public update access to questions" ON questions;
DROP POLICY IF EXISTS "Allow public delete access to questions" ON questions;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public insert access to user_profiles" ON user_profiles;

-- Tạo policies cho questions
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

-- Policies cho user_profiles
CREATE POLICY "Allow public read access to user_profiles"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to user_profiles"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Tạo tài khoản demo (chỉ chạy 1 lần)
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
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@demo.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin Demo", "role": "admin"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'user@demo.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "User Demo", "role": "user"}',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Tạo user profiles
INSERT INTO user_profiles (id, email, role, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@demo.com', 'admin', 'Admin Demo'),
  ('22222222-2222-2222-2222-222222222222', 'user@demo.com', 'user', 'User Demo')
ON CONFLICT (id) DO NOTHING;

-- Thông báo hoàn thành
SELECT 'Tất cả bảng và tài khoản demo đã được tạo thành công!' as message;
```

## ⚡ Bước 4: Paste và Run

1. **Paste** toàn bộ SQL script vào khung soạn thảo SQL Editor
2. **Kiểm tra** lại code đã paste đầy đủ
3. **Click nút "Run"** (màu xanh, góc phải) để thực thi
4. **Đợi** vài giây để SQL chạy xong

## ✅ Bước 5: Kiểm tra kết quả

Sau khi chạy SQL, bạn sẽ thấy:

### Thành công ✅
- **Thông báo**: "Bảng questions đã được tạo thành công!"
- **Không có lỗi** màu đỏ
- **Status**: Success hoặc tương tự

### Nếu có lỗi ❌
- **Đọc thông báo lỗi** màu đỏ
- **Kiểm tra lại** SQL script đã paste đúng chưa
- **Thử lại** bằng cách paste và run lần nữa

## 🔄 Bước 6: Refresh ứng dụng

1. **Quay lại** tab ứng dụng quiz (localhost:5173)
2. **Refresh trang** (F5 hoặc Ctrl+R)
3. **Kiểm tra** cảnh báo đã biến mất
4. **Thử upload** file câu hỏi để test

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
- ✅ Upload 400 câu hỏi Excel/CSV/JSON
- ✅ Lưu trữ vĩnh viễn trên cloud
- ✅ Truy cập từ bất kỳ đâu
- ✅ Không lo mất dữ liệu

## 🔍 Kiểm tra bảng đã tạo

Để xem bảng vừa tạo:
1. Click **"Table Editor"** trong menu trái
2. Tìm bảng **"questions"** trong danh sách
3. Click vào để xem cấu trúc bảng

## 🆘 Nếu gặp khó khăn

### Lỗi thường gặp:
1. **"permission denied"**: Kiểm tra bạn đã đăng nhập đúng project chưa
2. **"syntax error"**: Kiểm tra SQL script đã copy đầy đủ chưa
3. **"table already exists"**: Bảng đã tồn tại, có thể bỏ qua lỗi này

### Cần hỗ trợ:
- Screenshot màn hình lỗi
- Copy thông báo lỗi chính xác
- Cho biết bước nào gặp khó khăn

---

**Lưu ý**: Sau khi tạo bảng thành công, hãy refresh ứng dụng để thấy thay đổi!