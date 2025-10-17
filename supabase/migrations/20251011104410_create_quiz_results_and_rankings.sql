/*
  # Create Quiz Results and Rankings System

  1. New Tables
    - `quiz_results`
      - `id` (uuid, primary key) - Unique identifier for each quiz result
      - `user_id` (uuid, foreign key) - References auth.users
      - `score` (numeric) - Score achieved (0-100)
      - `total_questions` (integer) - Total number of questions in the quiz
      - `correct_answers` (integer) - Number of correct answers
      - `percentage` (numeric) - Percentage of correct answers
      - `time_spent` (integer) - Time spent in seconds
      - `quiz_type` (text) - Type of quiz ('practice' or 'exam')
      - `created_at` (timestamptz) - When the quiz was completed

  2. Views
    - `quiz_rankings`
      - Calculates average score, total attempts, and rank for each user
      - Shows user_id, user_name, average_score, total_attempts, rank
      - Ordered by average score descending

  3. Security
    - Enable RLS on `quiz_results` table
    - Policy: Authenticated users can insert their own results
    - Policy: Authenticated users can view all results (for leaderboard)

  4. Indexes
    - Index on user_id for fast user-specific queries
    - Index on score and created_at for ranking queries
*/

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  time_spent integer NOT NULL CHECK (time_spent > 0),
  quiz_type text NOT NULL DEFAULT 'practice' CHECK (quiz_type IN ('practice', 'exam')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own quiz results
CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view all quiz results for leaderboard
CREATE POLICY "Users can view all quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id 
  ON quiz_results(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_score 
  ON quiz_results(score DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at 
  ON quiz_results(created_at DESC);

-- Create quiz_rankings view
CREATE OR REPLACE VIEW quiz_rankings AS
SELECT 
  qr.user_id,
  up.full_name as user_name,
  up.email,
  ROUND(AVG(qr.score)::numeric, 2) as average_score,
  COUNT(qr.id) as total_attempts,
  MAX(qr.score) as best_score,
  MIN(qr.time_spent) as best_time,
  ROW_NUMBER() OVER (ORDER BY AVG(qr.score) DESC, MIN(qr.time_spent) ASC) as rank
FROM quiz_results qr
JOIN user_profiles up ON qr.user_id = up.id
GROUP BY qr.user_id, up.full_name, up.email
ORDER BY average_score DESC, best_time ASC;

-- Grant access to authenticated users
GRANT SELECT ON quiz_rankings TO authenticated;