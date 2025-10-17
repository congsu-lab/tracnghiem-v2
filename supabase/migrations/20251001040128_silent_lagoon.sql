/*
  # Sửa lỗi policy đã tồn tại - Clean up duplicate policies
  
  Lỗi: policy "Allow creators to insert quiz templates" for table "quiz_templates" already exists
  
  Giải pháp: Xóa tất cả policies cũ trước khi tạo mới để tránh xung đột
*/

-- Xóa tất cả policies cũ của quiz_templates để tránh xung đột
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Lấy tất cả policies của quiz_templates và xóa
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_templates'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_templates', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Tạo lại policies mới với tên duy nhất
CREATE POLICY "quiz_templates_public_select"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "quiz_templates_authenticated_insert"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "quiz_templates_creator_update"
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
SELECT 'Đã xóa policies cũ và tạo lại policies mới cho quiz_templates!' as message;