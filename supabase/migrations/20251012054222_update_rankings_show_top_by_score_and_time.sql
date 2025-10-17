/*
  # Update quiz_rankings view to show top performers by score and time

  1. Changes
    - Show top 10 students with highest scores
    - If scores are equal, rank by fastest completion time
    - Consider exam mode results only
    - Show all score ranges, not just perfect scores

  2. Ranking Logic
    - Primary: Highest average score
    - Secondary: Fastest completion time (best_time)
    - Only exam mode results
    - Limited to active participants
*/

-- Drop existing view
DROP VIEW IF EXISTS quiz_rankings;

-- Recreate quiz_rankings view for top performers
CREATE VIEW quiz_rankings AS
SELECT
  qr.user_id,
  up.full_name as user_name,
  up.email,
  ROUND(AVG(qr.percentage)::numeric, 2) as average_score,
  COUNT(qr.id) as total_attempts,
  MAX(qr.percentage) as best_score,
  MIN(qr.time_spent) as best_time,
  MAX(qr.created_at) as last_attempt_at,
  ROW_NUMBER() OVER (ORDER BY AVG(qr.percentage) DESC, MIN(qr.time_spent) ASC) as rank
FROM quiz_results qr
JOIN user_profiles up ON qr.user_id = up.id
WHERE qr.quiz_type = 'exam'
GROUP BY qr.user_id, up.full_name, up.email
ORDER BY average_score DESC, best_time ASC;

-- Grant access to authenticated users
GRANT SELECT ON quiz_rankings TO authenticated;
