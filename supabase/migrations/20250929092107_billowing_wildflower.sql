/*
  # Sửa lỗi RLS WITH CHECK clause khi soft delete
  
  Vấn đề: User ID = Template creator ID nhưng vẫn bị RLS chặn
  Nguyên nhân: WITH CHECK clause không cho phép set is_active = false
  
  Giải pháp: Loại bỏ WITH CHECK hoặc làm cho nó luôn true
*/

-- Xóa tất cả policies hiện tại
DROP POLICY IF EXISTS "Allow read active templates" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated insert" ON quiz_templates;
DROP POLICY IF EXISTS "Allow authenticated update" ON quiz_templates;

-- Tạo lại policies với WITH CHECK đúng
CREATE POLICY "quiz_templates_read_policy"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "quiz_templates_insert_policy"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy UPDATE không có WITH CHECK (cho phép mọi update)
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
  );
  -- Không có WITH CHECK = cho phép mọi update

-- Test policy bằng cách thử update một template
DO $$
DECLARE
  test_template_id uuid;
  current_user_id uuid;
BEGIN
  -- Lấy user hiện tại
  SELECT auth.uid() INTO current_user_id;
  
  -- Lấy template đầu tiên của user này
  SELECT id INTO test_template_id 
  FROM quiz_templates 
  WHERE created_by = current_user_id AND is_active = true 
  LIMIT 1;
  
  IF test_template_id IS NOT NULL THEN
    -- Thử update (không thực sự thay đổi gì)
    UPDATE quiz_templates 
    SET updated_at = now() 
    WHERE id = test_template_id;
    
    RAISE NOTICE 'Test update successful for template: %', test_template_id;
  ELSE
    RAISE NOTICE 'No templates found for current user: %', current_user_id;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test update failed: %', SQLERRM;
END $$;

-- Kiểm tra policies đã tạo
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quiz_templates'
ORDER BY policyname;

-- Thông báo hoàn thành
SELECT 'Đã sửa RLS WITH CHECK clause! Thử xóa template lại!' as message;