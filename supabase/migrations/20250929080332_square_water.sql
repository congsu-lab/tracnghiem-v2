-- Script sửa lỗi không thể xóa quiz templates
-- Chạy script này trong Supabase SQL Editor nếu vẫn không xóa được

-- Kiểm tra và sửa policy cho DELETE
DROP POLICY IF EXISTS "Allow creators to delete their quiz templates" ON quiz_templates;

-- Tạo lại policy DELETE với điều kiện rõ ràng hơn
CREATE POLICY "Allow creators to delete their quiz templates"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- Thêm policy cho phép admin xóa bất kỳ template nào
CREATE POLICY "Allow admin to delete any quiz template"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- Kiểm tra dữ liệu hiện tại
SELECT 
  id,
  name,
  created_by,
  is_active,
  created_at
FROM quiz_templates 
WHERE is_active = true
ORDER BY created_at DESC;

-- Kiểm tra user hiện tại
SELECT 
  auth.uid() as current_user_id,
  up.role as current_user_role
FROM user_profiles up 
WHERE up.id = auth.uid();

-- Thông báo hoàn thành
SELECT 'Đã sửa policies cho quiz_templates. Thử xóa lại bộ đề thi!' as message;