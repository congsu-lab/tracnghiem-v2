/*
  # Add DELETE policy for quiz_results table

  1. Changes
    - Add policy to allow authenticated users to delete quiz results
    - This enables admin users to clear all rankings data

  2. Security
    - Only authenticated users can delete quiz results
    - Policy allows deletion of any record (for admin cleanup)
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can delete quiz results" ON quiz_results;

-- Policy: Authenticated users can delete quiz results (for admin)
CREATE POLICY "Authenticated users can delete quiz results"
  ON quiz_results
  FOR DELETE
  TO authenticated
  USING (true);
