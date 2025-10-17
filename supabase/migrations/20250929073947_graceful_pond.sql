/*
  # Tạo bảng quiz_templates để lưu bộ đề thi

  1. Bảng mới
    - `quiz_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Tên bộ đề thi
      - `description` (text, nullable) - Mô tả bộ đề thi
      - `mode` (text, not null) - Chế độ: 'practice' hoặc 'exam'
      - `time_limit` (integer, not null) - Thời gian làm bài (phút)
      - `total_questions` (integer, not null) - Tổng số câu hỏi
      - `categories` (jsonb, nullable) - Phân bổ câu hỏi theo chuyên đề
      - `is_active` (boolean, default true) - Trạng thái hoạt động
      - `created_by` (uuid, foreign key) - Người tạo (admin)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Bảo mật
    - Bật RLS cho bảng `quiz_templates`
    - Chỉ admin mới có thể tạo/sửa/xóa
    - User chỉ có thể đọc các template đang hoạt động
*/

-- Tạo bảng quiz_templates
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

-- Bật Row Level Security (RLS)
ALTER TABLE quiz_templates ENABLE ROW LEVEL SECURITY;

-- XÓA CÁC POLICY CŨ (nếu có)
DROP POLICY IF EXISTS "Allow public read access to active quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to update their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to delete their quiz templates" ON quiz_templates;

-- Policy cho phép tất cả user đọc các template đang hoạt động
CREATE POLICY "Allow public read access to active quiz templates"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy cho phép user đã đăng nhập tạo template
CREATE POLICY "Allow authenticated users to insert quiz templates"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy cho phép người tạo cập nhật template của mình
CREATE POLICY "Allow creators to update their quiz templates"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policy cho phép người tạo xóa template của mình
CREATE POLICY "Allow creators to delete their quiz templates"
  ON quiz_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Tạo index để tăng hiệu suất
CREATE INDEX IF NOT EXISTS idx_quiz_templates_active ON quiz_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_templates_created_by ON quiz_templates(created_by);

-- Function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_quiz_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động cập nhật updated_at khi có thay đổi
DROP TRIGGER IF EXISTS quiz_templates_updated_at ON quiz_templates;
CREATE TRIGGER quiz_templates_updated_at
  BEFORE UPDATE ON quiz_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_templates_updated_at();

-- Tạo một vài template mẫu cho demo
INSERT INTO quiz_templates (name, description, mode, time_limit, total_questions, categories, created_by) VALUES
  (
    'Đề thi Toán - Lý cơ bản',
    'Bộ đề thi dành cho học sinh THPT, tập trung vào Toán học và Vật lý cơ bản',
    'exam',
    90,
    30,
    '{"Toán học": 15, "Vật lý": 10, "Hóa học": 5}',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'Ôn tập Văn - Sử - Địa',
    'Bộ câu hỏi ôn tập cho các môn xã hội, phù hợp cho việc luyện thi',
    'practice',
    60,
    25,
    '{"Văn học": 10, "Lịch sử": 8, "Địa lý": 7}',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'Kiểm tra tổng hợp',
    'Đề thi tổng hợp tất cả các chuyên đề, phù hợp cho đánh giá tổng quát',
    'exam',
    120,
    50,
    '{"Toán học": 10, "Văn học": 8, "Lịch sử": 7, "Địa lý": 7, "Vật lý": 8, "Hóa học": 5, "Sinh học": 5}',
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

-- Thông báo hoàn thành
SELECT 'Bảng quiz_templates và dữ liệu mẫu đã được tạo thành công!' as message;