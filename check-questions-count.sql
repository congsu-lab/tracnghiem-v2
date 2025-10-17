-- Kiểm tra tổng số câu hỏi trong database
SELECT COUNT(*) as total_questions FROM questions;

-- Kiểm tra số câu hỏi theo category
SELECT category, COUNT(*) as count
FROM questions
GROUP BY category
ORDER BY count DESC;

-- Kiểm tra 10 câu hỏi mới nhất
SELECT id, LEFT(question, 100) as question_preview, category, created_at
FROM questions
ORDER BY created_at DESC
LIMIT 10;
