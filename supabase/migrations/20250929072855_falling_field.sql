/*
  # Create quiz templates table

  1. New Tables
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

  2. Security
    - Enable RLS on `quiz_templates` table
    - Add policies for public read access
    - Add policies for admin write access
*/

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

-- Enable RLS
ALTER TABLE quiz_templates ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_templates
CREATE POLICY "Allow public read access to active quiz templates"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to insert quiz templates"
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_templates_active ON quiz_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_templates_created_by ON quiz_templates(created_by);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER quiz_templates_updated_at
  BEFORE UPDATE ON quiz_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_templates_updated_at();