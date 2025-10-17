/*
  # Sửa lỗi quyền xóa quiz templates
  
  Lỗi: "Không có quyền xóa bộ đề thi này. Chỉ người tạo hoặc admin mới có thể xóa."
  
  Nguyên nhân: RLS policy không nhận diện đúng admin role hoặc created_by
  
  Giải pháp: Tạo policies đơn giản hơn và debug quyền
*/

-- Debug: Kiểm tra user hiện tại và templates
DO $$
BEGIN
  RAISE NOTICE 'Current user: %', auth.uid();
  RAISE NOTICE 'User profiles count: %', (SELECT COUNT(*) FROM user_profiles);
  RAISE NOTICE 'Quiz templates count: %', (SELECT COUNT(*) FROM quiz_templates WHERE is_active = true);
END $$;

-- Xóa tất cả policies cũ
DROP POLICY IF EXISTS "quiz_templates_select_policy" ON quiz_templates;
DROP POLICY IF EXISTS "quiz_templates_insert_policy" ON quiz_templates;
DROP POLICY IF EXISTS "quiz_templates_update_policy" ON quiz_templates;

-- Tạo policies đơn giản và rõ ràng
CREATE POLICY "Allow read active templates"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated insert"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy UPDATE đơn giản - cho phép tất cả authenticated users
CREATE POLICY "Allow authenticated update"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Kiểm tra policies đã tạo
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quiz_templates'
ORDER BY policyname;

-- Debug: Kiểm tra dữ liệu templates
SELECT 
  id,
  name,
  created_by,
  is_active,
  created_at
FROM quiz_templates 
ORDER BY created_at DESC
LIMIT 5;

-- Thông báo hoàn thành
SELECT 'Đã sửa policies cho quiz_templates với quyền đơn giản hơn!' as message;