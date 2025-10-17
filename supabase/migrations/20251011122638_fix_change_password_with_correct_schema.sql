/*
  # Fix change password function with correct schema
  
  1. Changes
    - Fix search_path to include extensions schema
    - Use extensions.crypt and extensions.gen_salt
  
  2. Security
    - Only authenticated users can change their own password
*/

-- Drop old function if exists
DROP FUNCTION IF EXISTS change_user_password(TEXT);

-- Create new change password function with correct schema path
CREATE OR REPLACE FUNCTION change_user_password(new_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Update password in auth.users using extensions schema
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = current_user_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;