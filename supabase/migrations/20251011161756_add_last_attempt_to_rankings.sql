/*
  # Add last_attempt_at to quiz_rankings view

  1. Changes
    - Update quiz_rankings view to include last_attempt_at column
    - Shows the timestamp of the most recent quiz attempt for each user

  2. View Updates
    - `quiz_rankings`
      - Added `last_attempt_at` column showing MAX(created_at) from quiz_results
*/

-- Recreate quiz_rankings view with last_attempt_at
CREATE OR REPLACE VIEW quiz_rankings AS
SELECT 
  qr.user_id,
  up.full_name as user_name,
  up.email,
  ROUND(AVG(qr.score)::numeric, 2) as average_score,
  COUNT(qr.id) as total_attempts,
  MAX(qr.score) as best_score,
  MIN(qr.time_spent) as best_time,
  MAX(qr.created_at) as last_attempt_at,
  ROW_NUMBER() OVER (ORDER BY AVG(qr.score) DESC, MIN(qr.time_spent) ASC) as rank
FROM quiz_results qr
JOIN user_profiles up ON qr.user_id = up.id
GROUP BY qr.user_id, up.full_name, up.email
ORDER BY average_score DESC, best_time ASC;

-- Grant access to authenticated users
GRANT SELECT ON quiz_rankings TO authenticated;
