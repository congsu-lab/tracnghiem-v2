/*
  # Create Questions and Quiz Templates Tables
  
  1. New Tables
    - `questions` - Quiz questions with public access
      - `id` (text, primary key)
      - `question` (text)
      - `options` (text array)
      - `correct_answer` (integer)
      - `explanation` (text, optional)
      - `category` (text)
      - `created_at`, `updated_at` (timestamps)
      
    - `quiz_templates` - Pre-configured quiz templates
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `mode` (text: 'practice' or 'exam')
      - `time_limit` (integer, in minutes)
      - `total_questions` (integer)
      - `categories` (jsonb)
      - `is_active` (boolean)
      - `created_by` (uuid, foreign key)
      - `created_at`, `updated_at` (timestamps)
      
  2. Security
    - Enable RLS on both tables
    - Public access to questions (for unauthenticated quiz taking)
    - Public read access to active quiz templates
    - Creators and admins can manage quiz templates
    
  3. Triggers
    - Auto-update `updated_at` timestamp
*/

-- Create questions table
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

-- Create quiz_templates table
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

-- Create function to auto-update updated_at if not exists
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER quiz_templates_updated_at
  BEFORE UPDATE ON quiz_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();