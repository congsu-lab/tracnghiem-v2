/*
  # Create quiz results table for leaderboard

  1. New Tables
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_name` (text, display name)
      - `quiz_type` (text, 'practice' or 'exam')
      - `quiz_name` (text, name of the quiz)
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `score` (numeric, calculated as percentage)
      - `time_spent` (integer, in seconds)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `quiz_results` table
    - Add policy for authenticated users to insert their own results
    - Add policy for all users to view leaderboard (read-only)
    
  3. Indexes
    - Index on quiz_type for fast leaderboard queries
    - Index on score and time_spent for ranking
*/

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  quiz_type text NOT NULL CHECK (quiz_type IN ('practice', 'exam')),
  quiz_name text NOT NULL DEFAULT 'Bài thi tổng hợp',
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  time_spent integer NOT NULL CHECK (time_spent > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own results
CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Everyone can view leaderboard (authenticated users only)
CREATE POLICY "Users can view leaderboard"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_type 
  ON quiz_results(quiz_type);

CREATE INDEX IF NOT EXISTS idx_quiz_results_ranking 
  ON quiz_results(score DESC, time_spent ASC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at 
  ON quiz_results(created_at DESC);