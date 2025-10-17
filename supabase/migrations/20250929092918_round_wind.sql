/*
  # Tạo RPC function để bypass RLS khi xóa quiz templates
  
  Vấn đề: RLS policies xung đột không thể sửa được
  Giải pháp: Tạo RPC function chạy với SECURITY DEFINER để bypass RLS
*/

-- Tạo RPC function để xóa template (soft delete)
CREATE OR REPLACE FUNCTION delete_quiz_template(template_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền của owner (bypass RLS)
AS $$
DECLARE
  template_record RECORD;
  current_user_id uuid;
  user_role text;
  result json;
BEGIN
  -- Lấy current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Chưa đăng nhập'
    );
  END IF;
  
  -- Lấy thông tin template
  SELECT * INTO template_record
  FROM quiz_templates
  WHERE id = template_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Không tìm thấy bộ đề thi'
    );
  END IF;
  
  -- Lấy role của user
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = current_user_id;
  
  -- Kiểm tra quyền: phải là creator hoặc admin
  IF template_record.created_by != current_user_id AND user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Không có quyền xóa bộ đề thi này'
    );
  END IF;
  
  -- Thực hiện soft delete (bypass RLS vì SECURITY DEFINER)
  UPDATE quiz_templates
  SET is_active = false,
      updated_at = now()
  WHERE id = template_id;
  
  -- Trả về kết quả thành công
  RETURN json_build_object(
    'success', true,
    'message', 'Đã xóa bộ đề thi thành công',
    'template_name', template_record.name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Lỗi hệ thống: ' || SQLERRM
    );
END;
$$;

-- Test RPC function
DO $$
DECLARE
  test_result json;
BEGIN
  -- Tạo template test
  INSERT INTO quiz_templates (name, description, mode, time_limit, total_questions, created_by)
  VALUES ('RPC_TEST_TEMPLATE', 'Test RPC delete', 'practice', 60, 10, auth.uid());
  
  -- Test xóa bằng RPC
  SELECT delete_quiz_template(id) INTO test_result
  FROM quiz_templates
  WHERE name = 'RPC_TEST_TEMPLATE';
  
  RAISE NOTICE 'RPC Test Result: %', test_result;
  
  -- Cleanup
  DELETE FROM quiz_templates WHERE name = 'RPC_TEST_TEMPLATE';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RPC Test Failed: %', SQLERRM;
    DELETE FROM quiz_templates WHERE name = 'RPC_TEST_TEMPLATE';
END $$;

-- Thông báo hoàn thành
SELECT 'RPC function delete_quiz_template đã được tạo thành công!' as message;