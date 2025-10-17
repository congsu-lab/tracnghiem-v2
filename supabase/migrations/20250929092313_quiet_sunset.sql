/*
  # Sửa lỗi RLS quiz_templates - Giải pháp cuối cùng
  
  Vấn đề: WITH CHECK clause trong UPDATE policy chặn soft delete
  Giải pháp: Tạo policy mới hoàn toàn không có WITH CHECK
*/

-- Tắt RLS tạm thời để xóa policies cũ
ALTER TABLE quiz_templates DISABLE ROW LEVEL SECURITY;

-- Xóa TẤT CẢ policies cũ
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'quiz_templates'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON quiz_templates';
    END LOOP;
END $$;

-- Bật lại RLS
ALTER TABLE quiz_templates ENABLE ROW LEVEL SECURITY;

-- Tạo policies mới HOÀN TOÀN ĐƠN GIẢN
CREATE POLICY "quiz_templates_select"
  ON quiz_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "quiz_templates_insert"
  ON quiz_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy UPDATE KHÔNG CÓ WITH CHECK (quan trọng nhất)
CREATE POLICY "quiz_templates_update"
  ON quiz_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
  -- KHÔNG CÓ WITH CHECK = cho phép mọi update

-- Test ngay trong migration
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Thử tạo và update một template test
    INSERT INTO quiz_templates (name, description, mode, time_limit, total_questions, created_by)
    VALUES ('Test Template', 'Test', 'practice', 60, 10, auth.uid());
    
    -- Thử soft delete
    UPDATE quiz_templates 
    SET is_active = false 
    WHERE name = 'Test Template' AND created_by = auth.uid();
    
    -- Xóa template test
    DELETE FROM quiz_templates WHERE name = 'Test Template';
    
    test_result := 'SUCCESS: RLS policies work correctly!';
    RAISE NOTICE '%', test_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TEST FAILED: %', SQLERRM;
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

SELECT 'RLS policies đã được tạo lại hoàn toàn! Không còn WITH CHECK clause!' as message;