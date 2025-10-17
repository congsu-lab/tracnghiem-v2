/*
  # Đơn giản hóa RLS policies cho user_profiles
  
  1. Xóa tất cả policies cũ phức tạp
  2. Tạo policies mới đơn giản hơn:
     - Users có thể xem profile của chính họ
     - Users có thể insert profile của chính họ (khi đăng ký)
     - Users có thể update profile của chính họ
     - Không cho delete profile (để tránh mất dữ liệu)
  
  3. Note: Admin access sẽ được xử lý riêng ở application layer
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "select_own_or_admin" ON user_profiles;
DROP POLICY IF EXISTS "insert_own" ON user_profiles;
DROP POLICY IF EXISTS "update_own_or_admin" ON user_profiles;
DROP POLICY IF EXISTS "delete_admin_only" ON user_profiles;

-- Tạo policies đơn giản
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Không có DELETE policy - không ai được xóa profile
