# Hướng dẫn cấu hình Supabase cho Ứng dụng Luyện Thi

## 🎯 Tại sao cần Supabase?
- **Lưu trữ vĩnh viễn**: Câu hỏi không bị mất khi tắt trình duyệt
- **Đồng bộ**: Truy cập từ nhiều thiết bị
- **Backup tự động**: An toàn dữ liệu
- **Hiệu suất cao**: Tải nhanh hơn

## 📋 Bước 1: Tạo tài khoản Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Đăng ký bằng GitHub hoặc email
4. Xác nhận email (nếu cần)

## 🏗️ Bước 2: Tạo project mới

1. Sau khi đăng nhập, click **"New Project"**
2. Chọn **Organization** (hoặc tạo mới)
3. Điền thông tin project:
   - **Name**: `quiz-app` (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại)
   - **Region**: Chọn gần Việt Nam nhất (Singapore)
4. Click **"Create new project"**
5. Đợi 2-3 phút để setup hoàn tất

## 🔑 Bước 3: Lấy API Keys

1. Trong dashboard project, click **Settings** (biểu tượng bánh răng)
2. Click **API** trong menu bên trái
3. Copy 2 thông tin sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚙️ Bước 4: Cấu hình ứng dụng

1. Mở file `.env` trong project
2. Thay thế các giá trị:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ví dụ thực tế:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1NzI4MDAsImV4cCI6MjAwNTEzMjgwMH0.example-signature
```

## 🔄 Bước 5: Restart ứng dụng

1. Dừng dev server (Ctrl+C)
2. Chạy lại: `npm run dev`
3. Mở lại ứng dụng

## 🗄️ Bước 6: Tạo bảng database (Tự động)

**QUAN TRỌNG: Tạo các bảng cần thiết**

Bạn cần tạo 2 bảng: `questions` (câu hỏi) và `user_profiles` (thông tin người dùng):
1. Vào Supabase Dashboard → **SQL Editor**
2. Copy và paste đoạn SQL sau:
```sql
-- Tạo bảng questions để lưu câu hỏi
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to questions"
  ON questions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access to questions"
  ON questions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access to questions"
  ON questions FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access to questions"
  ON questions FOR DELETE TO public USING (true);

-- Tạo bảng user_profiles để lưu thông tin người dùng
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy cho user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Tạo tài khoản admin và user demo
-- Tạo tài khoản demo thông qua auth.users với raw_user_meta_data
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@demo.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Quản trị viên Demo", "role": "admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'user@demo.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Người dùng Demo", "role": "user"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, email, full_name, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@demo.com', 'Quản trị viên Demo', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'user@demo.com', 'Người dùng Demo', 'user')
ON CONFLICT (id) DO NOTHING;
```

3. Click **Run** để thực thi
4. Refresh lại ứng dụng

## ✅ Kiểm tra kết nối thành công

Sau khi cấu hình xong, bạn sẽ thấy:
- ✅ Có thể đăng nhập bằng tài khoản demo
- ✅ Admin: admin@demo.com / admin123
- ✅ User: user@demo.com / user123
- ✅ Phân quyền hoạt động đúng

## 🔧 Xử lý sự cố

### Lỗi "Invalid URL"
- Kiểm tra URL có đúng format: `https://xxx.supabase.co`
- Không có dấu `/` ở cuối

### Lỗi "Invalid API Key"
- Đảm bảo copy đúng **anon public key**
- Không phải service_role key

### Lỗi kết nối
- Kiểm tra internet
- Thử refresh trang Supabase dashboard

## 💡 Mẹo hữu ích

1. **Backup định kỳ**: Xuất JSON/Excel thường xuyên
2. **Tài khoản demo**: Sử dụng để test hệ thống
3. **Free tier**: 500MB storage, 2GB bandwidth/tháng
4. **Phân quyền**: Admin quản lý, User chỉ ôn thi
5. **Bảo mật**: RLS đảm bảo an toàn dữ liệu

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
- Đăng nhập với 2 loại tài khoản
- Admin: Quản lý câu hỏi và cấu hình
- User: Ôn thi và thi thử
- Dữ liệu lưu vĩnh viễn trên cloud

---

**Cần hỗ trợ?** Liên hệ qua GitHub Issues hoặc email.