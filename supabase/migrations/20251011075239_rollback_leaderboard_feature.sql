/*
  # Rollback leaderboard feature
  
  1. Drop Tables & Views
    - Drop view `student_statistics`
    - Drop table `user_profiles`
    - Drop table `quiz_results`
  
  2. Security
    - Remove all related RLS policies
*/

-- Drop view first
DROP VIEW IF EXISTS student_statistics;

-- Drop tables
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
