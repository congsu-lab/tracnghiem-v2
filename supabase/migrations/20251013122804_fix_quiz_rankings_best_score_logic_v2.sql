/*
  # Fix quiz_rankings to show best score with corresponding time
  
  1. Changes
    - Rank by highest score (not average)
    - Show time from the attempt with highest score
    - If multiple attempts have same highest score, use fastest time among them
    - If scores are equal between users, rank by fastest time
  
  2. Ranking Logic
    - Primary: Highest score achieved (best_score)
    - Secondary: Time from best scoring attempt (best_score_time)
    - Only exam mode results
*/

-- Drop existing view
DROP VIEW IF EXISTS quiz_rankings;

-- Recreate quiz_rankings view with correct logic
CREATE VIEW quiz_rankings AS
WITH user_best_scores AS (
  SELECT 
    user_id,
    MAX(percentage) as best_score
  FROM quiz_results
  WHERE quiz_type = 'exam'
  GROUP BY user_id
),
best_score_times AS (
  SELECT 
    qr.user_id,
    qr.percentage as best_score,
    MIN(qr.time_spent) as best_score_time
  FROM quiz_results qr
  INNER JOIN user_best_scores ubs ON qr.user_id = ubs.user_id AND qr.percentage = ubs.best_score
  WHERE qr.quiz_type = 'exam'
  GROUP BY qr.user_id, qr.percentage
),
user_stats AS (
  SELECT
    qr.user_id,
    COUNT(qr.id) as total_attempts,
    MAX(qr.created_at) as last_attempt_at
  FROM quiz_results qr
  WHERE qr.quiz_type = 'exam'
  GROUP BY qr.user_id
)
SELECT
  bst.user_id,
  up.full_name as user_name,
  up.email,
  bst.best_score as average_score,
  us.total_attempts,
  bst.best_score,
  bst.best_score_time as best_time,
  us.last_attempt_at,
  ROW_NUMBER() OVER (ORDER BY bst.best_score DESC, bst.best_score_time ASC) as rank
FROM best_score_times bst
JOIN user_profiles up ON bst.user_id = up.id
JOIN user_stats us ON bst.user_id = us.user_id
ORDER BY bst.best_score DESC, bst.best_score_time ASC;

-- Grant access to authenticated users
GRANT SELECT ON quiz_rankings TO authenticated;
GRANT SELECT ON quiz_rankings TO anon;
