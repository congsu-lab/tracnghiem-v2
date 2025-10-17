/*
  # Tạo bảng theo dõi phiên đăng nhập

  1. Bảng mới
    - `active_sessions`
      - `id` (uuid, primary key) - ID phiên
      - `user_id` (uuid) - ID người dùng
      - `session_id` (text) - ID session từ Supabase Auth
      - `device_info` (text) - Thông tin thiết bị
      - `ip_address` (text) - Địa chỉ IP
      - `is_active` (boolean) - Trạng thái hoạt động
      - `last_activity` (timestamptz) - Lần hoạt động cuối
      - `created_at` (timestamptz) - Thời gian tạo

  2. Bảo mật
    - Bật RLS cho bảng `active_sessions`
    - Chỉ user được xem session của chính mình
    - Chỉ user được cập nhật session của chính mình

  3. Chỉ mục
    - Index trên `user_id` để truy vấn nhanh
    - Index trên `session_id` để kiểm tra nhanh
*/

-- Tạo bảng active_sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  device_info text DEFAULT '',
  ip_address text DEFAULT '',
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Bật RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem session của mình
CREATE POLICY "Users can view own sessions"
  ON active_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: User chỉ insert session của mình
CREATE POLICY "Users can insert own sessions"
  ON active_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: User chỉ update session của mình
CREATE POLICY "Users can update own sessions"
  ON active_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: User chỉ delete session của mình
CREATE POLICY "Users can delete own sessions"
  ON active_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tạo index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active) WHERE is_active = true;

-- Function để tự động xóa các session cũ (> 24h không hoạt động)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE last_activity < now() - interval '24 hours';
END;
$$;