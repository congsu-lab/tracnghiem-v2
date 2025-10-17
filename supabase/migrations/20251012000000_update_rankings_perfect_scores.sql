/*
  # Update quiz_rankings view to show only perfect scores

  1. Changes
    - Modify quiz_rankings view to only include users with 100% exam scores
    - Rank by fastest completion time for perfect scores
    - Only consider exam mode results (quiz_type = 'exam')

  2. View Updates
    - `quiz_rankings`
      - Filter: percentage = 100 (perfect score)
      - Filter: quiz_type = 'exam' (exam mode only)
      - Order: best_time ASC (fastest completion time first)
      - Show user name, completion time, and champion title
*/

-- Drop existing view
DROP VIEW IF EXISTS quiz_rankings;

-- Recreate quiz_rankings view for perfect score champions only
CREATE VIEW quiz_rankings AS
SELECT
  qr.user_id,
  up.full_name as user_name,
  up.email,
  100.0 as average_score,
  COUNT(qr.id) as total_attempts,
  100.0 as best_score,
  MIN(qr.time_spent) as best_time,
  MAX(qr.created_at) as last_attempt_at,
  ROW_NUMBER() OVER (ORDER BY MIN(qr.time_spent) ASC) as rank
FROM quiz_results qr
JOIN user_profiles up ON qr.user_id = up.id
WHERE qr.quiz_type = 'exam' AND qr.percentage = 100
GROUP BY qr.user_id, up.full_name, up.email
ORDER BY best_time ASC;

-- Grant access to authenticated users
GRANT SELECT ON quiz_rankings TO authenticated;
