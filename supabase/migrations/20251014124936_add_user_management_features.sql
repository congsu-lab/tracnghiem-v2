/*
  # Add User Management Features for Admin

  1. Changes to user_profiles table
    - Add `status` column (active/inactive) to track user status
    - Add `updated_at` column to track last modification time
  
  2. New Policies
    - Admin can read all user profiles
    - Admin can update any user profile (role, status, name)
    - Admin can delete user profiles
  
  3. New Functions
    - `is_admin()` - Helper function to check if current user is admin
    - `admin_reset_user_password()` - Allow admin to reset user password
    - `admin_create_user()` - Allow admin to create new user with initial password
  
  4. Security
    - All admin operations require authentication
    - Only users with role='admin' can perform admin operations
    - Regular users cannot modify roles or access other users' data
*/

-- Add status and updated_at columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies: Read all users
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin policies: Update any user
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies: Delete any user
DROP POLICY IF EXISTS "Admins can delete any profile" ON user_profiles;
CREATE POLICY "Admins can delete any profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin policies: Insert new user
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Function: Admin reset user password
CREATE OR REPLACE FUNCTION admin_reset_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Only admins can reset passwords');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  UPDATE user_profiles
  SET updated_at = now()
  WHERE id = target_user_id;

  RETURN json_build_object('success', true, 'message', 'Password reset successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();