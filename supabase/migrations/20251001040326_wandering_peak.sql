/*
  # Sửa lỗi ON CONFLICT - thiếu unique constraints
  
  Lỗi: there is no unique or exclusion constraint matching the ON CONFLICT specification
  
  Nguyên nhân: Các bảng thiếu unique constraints cần thiết cho ON CONFLICT
  
  Giải pháp: Thêm unique constraints và sửa các INSERT statements
*/

-- Kiểm tra và thêm unique constraints nếu chưa có

-- 1. Đảm bảo user_profiles có unique constraint trên email
DO $$
BEGIN
  -- Kiểm tra xem constraint đã tồn tại chưa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_email_key' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Xóa duplicate emails trước khi thêm constraint
    DELETE FROM user_profiles a USING user_profiles b 
    WHERE a.id > b.id AND a.email = b.email;
    
    -- Thêm unique constraint
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on user_profiles.email';
  ELSE
    RAISE NOTICE 'Unique constraint on user_profiles.email already exists';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- 2. Đảm bảo auth.users có unique constraint trên email (thường đã có sẵn)
DO $$
BEGIN
  -- Kiểm tra xem constraint đã tồn tại chưa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_email_key' 
    AND table_name = 'users'
    AND table_schema = 'auth'
  ) THEN
    -- Xóa duplicate emails trong auth.users trước
    DELETE FROM auth.users a USING auth.users b 
    WHERE a.id > b.id AND a.email = b.email;
    
    -- Thêm unique constraint nếu chưa có
    ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on auth.users.email';
  ELSE
    RAISE NOTICE 'Unique constraint on auth.users.email already exists';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error with auth.users constraint: %', SQLERRM;
END $$;

-- 3. Tạo lại demo accounts với cách tiếp cận an toàn hơn
DO $$
DECLARE
  admin_user_id uuid;
  regular_user_id uuid;
  admin_exists boolean := false;
  user_exists boolean := false;
BEGIN
  -- Kiểm tra xem users đã tồn tại chưa
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@demo.com') INTO admin_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'user@demo.com') INTO user_exists;

  -- Tạo admin user nếu chưa tồn tại
  IF NOT admin_exists THEN
    admin_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@demo.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin Demo", "role": "admin"}',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created admin user with ID: %', admin_user_id;
  ELSE
    SELECT id FROM auth.users WHERE email = 'admin@demo.com' INTO admin_user_id;
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;

  -- Tạo regular user nếu chưa tồn tại
  IF NOT user_exists THEN
    regular_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      regular_user_id,
      'authenticated',
      'authenticated',
      'user@demo.com',
      crypt('user123', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "User Demo", "role": "user"}',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created regular user with ID: %', regular_user_id;
  ELSE
    SELECT id FROM auth.users WHERE email = 'user@demo.com' INTO regular_user_id;
    RAISE NOTICE 'Regular user already exists with ID: %', regular_user_id;
  END IF;

  -- Tạo user profiles với UPSERT an toàn
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, full_name) 
    VALUES (admin_user_id, 'admin@demo.com', 'admin', 'Admin Demo')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email, 
      role = EXCLUDED.role, 
      full_name = EXCLUDED.full_name;
    
    RAISE NOTICE 'Upserted admin profile';
  END IF;

  IF regular_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, full_name) 
    VALUES (regular_user_id, 'user@demo.com', 'user', 'User Demo')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email, 
      role = EXCLUDED.role, 
      full_name = EXCLUDED.full_name;
    
    RAISE NOTICE 'Upserted regular user profile';
  END IF;

  -- Tạo sample quiz templates nếu admin tồn tại
  IF admin_user_id IS NOT NULL THEN
    -- Xóa templates cũ của admin này trước
    DELETE FROM quiz_templates WHERE created_by = admin_user_id;
    
    -- Tạo templates mới
    INSERT INTO quiz_templates (name, description, mode, time_limit, total_questions, categories, created_by) VALUES
      (
        'Đề thi Toán - Lý cơ bản',
        'Bộ đề thi dành cho học sinh THPT, tập trung vào Toán học và Vật lý cơ bản',
        'exam',
        90,
        30,
        '{"Toán học": 15, "Vật lý": 10, "Hóa học": 5}',
        admin_user_id
      ),
      (
        'Ôn tập Văn - Sử - Địa',
        'Bộ câu hỏi ôn tập cho các môn xã hội, phù hợp cho việc luyện thi',
        'practice',
        60,
        25,
        '{"Văn học": 10, "Lịch sử": 8, "Địa lý": 7}',
        admin_user_id
      ),
      (
        'Kiểm tra tổng hợp',
        'Đề thi tổng hợp tất cả các chuyên đề, phù hợp cho đánh giá tổng quát',
        'exam',
        120,
        50,
        '{"Toán học": 10, "Văn học": 8, "Lịch sử": 7, "Địa lý": 7, "Vật lý": 8, "Hóa học": 5, "Sinh học": 5}',
        admin_user_id
      );
    
    RAISE NOTICE 'Created sample quiz templates';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in demo accounts creation: %', SQLERRM;
END $$;

-- Kiểm tra kết quả
SELECT 
  'Demo accounts status:' as info,
  (SELECT COUNT(*) FROM auth.users WHERE email IN ('admin@demo.com', 'user@demo.com')) as auth_users_count,
  (SELECT COUNT(*) FROM user_profiles WHERE email IN ('admin@demo.com', 'user@demo.com')) as profiles_count,
  (SELECT COUNT(*) FROM quiz_templates WHERE is_active = true) as templates_count;

-- Thông báo hoàn thành
SELECT 'Fixed ON CONFLICT constraints! All unique constraints and demo accounts are ready!' as message;