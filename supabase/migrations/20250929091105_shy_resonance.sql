/*
  # Sửa lỗi RLS policy khi xóa quiz templates
  
  Lỗi: new row violates row-level security policy for table "quiz_templates"
  
  Nguyên nhân: Policy WITH CHECK không cho phép UPDATE với is_active = false
  
  Giải pháp: Tạo lại policies với WITH CHECK đúng cho soft delete
*/

-- Xóa tất cả policies cũ để tránh xung đột
DROP POLICY IF EXISTS "Allow public read access to active quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to insert quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated users to create quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to update their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to delete their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to soft delete their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow admin to delete any quiz template" ON quiz_templates;
DROP POLICY IF EXISTS "Allow admin to manage all quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Admins can manage all quiz templates" ON quiz_templates;

-- Policy cho SELECT (đọc) - chỉ templates đang active
CREATE POLICY "quiz_templates_select_policy"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy cho INSERT (tạo mới) - chỉ người đã đăng nhập
CREATE POLICY "quiz_templates_insert_policy"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy cho UPDATE (cập nhật và soft delete) - người tạo hoặc admin
CREATE POLICY "quiz_templates_update_policy"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Cho phép tất cả updates từ người tạo hoặc admin
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Kiểm tra policies đã tạo
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quiz_templates'
ORDER BY policyname;

-- Thông báo hoàn thành
SELECT 'Đã sửa RLS policies cho quiz_templates! Bây giờ có thể xóa templates!' as message;