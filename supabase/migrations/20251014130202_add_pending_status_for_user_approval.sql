/*
  # Add Pending Status for User Approval Workflow

  1. Changes to user_profiles table
    - Add 'pending' to status enum values
    - Update default status to 'pending' for new registrations
    - Keep 'active' and 'inactive' for existing workflow
  
  2. Security
    - Pending users cannot access the system
    - Only admins can approve/reject pending users
    - Login checks will validate status before granting access
  
  3. Usage
    - New user registrations default to 'pending'
    - Admins can change status from 'pending' to 'active' to approve
    - Admins can change status from 'pending' to 'inactive' to reject
*/

-- Drop existing constraint and recreate with pending status
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_status_check;

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_status_check 
  CHECK (status IN ('active', 'inactive', 'pending'));

-- Update default status for new users to pending
ALTER TABLE user_profiles ALTER COLUMN status SET DEFAULT 'pending';

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for user self-registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();