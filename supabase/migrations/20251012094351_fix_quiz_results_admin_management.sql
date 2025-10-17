/*
  # Fix Admin Quiz Results Management
  
  ## Changes
  1. Add policy for admins to update quiz results
  2. Improve delete policy to allow admins
  
  ## Security
  - Admins can manage all quiz results
  - Users can only delete their own results
*/

-- Allow admins to update all quiz results
CREATE POLICY "Admins can update all quiz results"
  ON quiz_results
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Drop the overly permissive delete policy
DROP POLICY IF EXISTS "Users can delete quiz results" ON quiz_results;

-- Allow users to delete their own results and admins to delete all
CREATE POLICY "Users can delete own results, admins can delete all"
  ON quiz_results
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
