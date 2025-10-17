/*
  # Sửa lỗi RLS khi xóa quiz templates
  
  Lỗi: new row violates row-level security policy for table "quiz_templates"
  
  Nguyên nhân: Policy DELETE không đúng, app đang dùng UPDATE để soft delete
  nhưng policy UPDATE không cho phép set is_active = false
  
  Giải pháp: Sửa policies để cho phép soft delete (UPDATE is_active = false)
*/

-- Xóa policies cũ có thể gây xung đột
DROP POLICY IF EXISTS "Allow creators to delete their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow creators to soft delete their quiz templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow admin to delete any quiz template" ON quiz_templates;
DROP POLICY IF EXISTS "Admins can manage all quiz templates" ON quiz_templates;

-- Tạo lại policy UPDATE cho phép soft delete
CREATE POLICY "Allow creators to update their quiz templates"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy riêng cho admin có thể update/delete bất kỳ template nào
CREATE POLICY "Allow admin to manage all quiz templates"
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
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy cho INSERT (tạo mới)
CREATE POLICY "Allow authenticated users to create quiz templates"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Kiểm tra policies hiện tại
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quiz_templates'
ORDER BY policyname;

-- Thông báo hoàn thành
SELECT 'Đã sửa RLS policies cho quiz_templates. Bây giờ có thể xóa templates!' as message;