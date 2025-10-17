/*
  # Create questions table

  1. New Tables
    - `questions`
      - `id` (text, primary key)
      - `question` (text, not null)
      - `options` (text array, not null)
      - `correct_answer` (integer, not null)
      - `explanation` (text, nullable)
      - `category` (text, not null)
      - `created_at` (timestamp with timezone, default now)
      - `updated_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `questions` table
    - Add policy for public read access (since this is a quiz app)
    - Add policy for public write access (for adding questions)
*/

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

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to questions
CREATE POLICY IF NOT EXISTS "Allow public read access to questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access to questions
CREATE POLICY IF NOT EXISTS "Allow public insert access to questions"
  ON questions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access to questions
CREATE POLICY IF NOT EXISTS "Allow public update access to questions"
  ON questions
  FOR UPDATE
  TO public
  USING (true);

-- Allow public delete access to questions
CREATE POLICY IF NOT EXISTS "Allow public delete access to questions"
  ON questions
  FOR DELETE
  TO public
  USING (true);