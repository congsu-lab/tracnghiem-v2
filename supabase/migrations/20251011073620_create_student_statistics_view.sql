/*
  # Create student statistics view for high-scoring students

  1. New Views
    - `student_statistics`
      - Aggregate quiz results by student
      - Calculate average score, best score, total attempts
      - Include best time for their best score
      
  2. Features
    - Shows students who scored >= 80% (high performers)
    - Ranks by best score (desc) then best time (asc)
    - Includes total quiz attempts and average score
    
  3. Security
    - View is accessible to authenticated users
*/

-- Create view for student statistics
CREATE OR REPLACE VIEW student_statistics AS
WITH best_scores AS (
  SELECT 
    user_id,
    user_name,
    score,
    time_spent,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, time_spent ASC) as rn
  FROM quiz_results
  WHERE quiz_type = 'exam'
),
user_stats AS (
  SELECT 
    qr.user_id,
    qr.user_name,
    COUNT(*) as total_attempts,
    ROUND(AVG(qr.score)::numeric, 2) as average_score,
    MAX(qr.score) as best_score,
    COUNT(*) FILTER (WHERE qr.quiz_type = 'exam') as exam_attempts,
    COUNT(*) FILTER (WHERE qr.quiz_type = 'practice') as practice_attempts,
    MAX(qr.created_at) as last_attempt_date
  FROM quiz_results qr
  GROUP BY qr.user_id, qr.user_name
)
SELECT 
  us.user_id,
  us.user_name,
  us.total_attempts,
  us.average_score,
  us.best_score,
  COALESCE(bs.time_spent, 0) as best_time,
  us.exam_attempts,
  us.practice_attempts,
  us.last_attempt_date
FROM user_stats us
LEFT JOIN best_scores bs ON us.user_id = bs.user_id AND bs.rn = 1
WHERE us.best_score >= 80
ORDER BY us.best_score DESC, COALESCE(bs.time_spent, 999999) ASC;

-- Grant access to authenticated users
GRANT SELECT ON student_statistics TO authenticated;

-- Create function to get top performers
CREATE OR REPLACE FUNCTION get_top_performers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  user_name text,
  total_attempts bigint,
  average_score numeric,
  best_score numeric,
  best_time integer,
  exam_attempts bigint,
  practice_attempts bigint,
  last_attempt_date timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.best_score DESC, ss.best_time ASC)::integer as rank,
    ss.user_id,
    ss.user_name,
    ss.total_attempts,
    ss.average_score,
    ss.best_score,
    ss.best_time,
    ss.exam_attempts,
    ss.practice_attempts,
    ss.last_attempt_date
  FROM student_statistics ss
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top_performers TO authenticated;