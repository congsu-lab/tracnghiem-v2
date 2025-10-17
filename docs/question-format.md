# Hướng dẫn cấu trúc file câu hỏi

## 1. Định dạng JSON (Khuyến nghị)

### Cấu trúc cơ bản:
```json
[
  {
    "id": "q1",
    "question": "Câu hỏi của bạn?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": 2,
    "explanation": "Giải thích tại sao đáp án này đúng",
    "category": "Tên chuyên đề"
  }
]
```

### Các trường bắt buộc:
- `id`: Mã định danh duy nhất (string)
- `question`: Nội dung câu hỏi (string)
- `options`: Mảng 4 đáp án (array of strings)
- `correctAnswer`: Đáp án đúng 1-based (1=A, 2=B, 3=C, 4=D)
- `category`: Chuyên đề (string)

### Các trường tùy chọn:
- `explanation`: Giải thích đáp án (string)

## 2. Định dạng CSV

### Cấu trúc header:
```csv
question,option_a,option_b,option_c,option_d,correct_answer,explanation,category
```

### Ví dụ:
```csv
question,option_a,option_b,option_c,option_d,correct_answer,explanation,category
"Thủ đô của Việt Nam là gì?","Hồ Chí Minh","Hà Nội","Đà Nẵng","Cần Thơ",2,"Hà Nội là thủ đô của Việt Nam","Địa lý"
"2 + 2 = ?","3","4","5","6",2,"Phép cộng cơ bản","Toán học"
```

### Lưu ý CSV:
- Sử dụng dấu phẩy (,) làm phân cách
- Đặt nội dung trong dấu ngoặc kép ("") nếu có dấu phẩy
- `correct_answer` là số từ 1-4 (1=A, 2=B, 3=C, 4=D)

## 3. Ví dụ hoàn chỉnh

### File JSON mẫu (questions.json):
```json
[
  {
    "id": "geo_001",
    "question": "Thủ đô của Việt Nam là gì?",
    "options": ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"],
    "correctAnswer": 2,
    "explanation": "Hà Nội là thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam từ năm 1976.",
    "category": "Địa lý"
  },
  {
    "id": "math_001",
    "question": "Kết quả của 15 + 25 × 2 là bao nhiêu?",
    "options": ["80", "65", "55", "70"],
    "correctAnswer": 2,
    "explanation": "Theo thứ tự ưu tiên phép tính: 25 × 2 = 50, sau đó 15 + 50 = 65.",
    "category": "Toán học"
  },
  {
    "id": "chem_001",
    "question": "Nguyên tố hóa học nào có ký hiệu là 'O'?",
    "options": ["Oxi", "Vàng", "Bạc", "Sắt"],
    "correctAnswer": 1,
    "explanation": "Oxi (Oxygen) có ký hiệu hóa học là O, là nguyên tố thiết yếu cho sự sống.",
    "category": "Hóa học"
  }
]
```

### File CSV mẫu (questions.csv):
```csv
question,option_a,option_b,option_c,option_d,correct_answer,explanation,category
"Thủ đô của Việt Nam là gì?","Hồ Chí Minh","Hà Nội","Đà Nẵng","Cần Thơ",2,"Hà Nội là thủ đô của Việt Nam từ năm 1976","Địa lý"
"Kết quả của 15 + 25 × 2 là bao nhiêu?","80","65","55","70",2,"Theo thứ tự ưu tiên: 25 × 2 = 50, sau đó 15 + 50 = 65","Toán học"
"Nguyên tố hóa học nào có ký hiệu là 'O'?","Oxi","Vàng","Bạc","Sắt",1,"Oxi có ký hiệu hóa học là O","Hóa học"
```

## 4. Quy tắc quan trọng

### Đáp án (correctAnswer):
- **Luôn sử dụng số 1-4**
- 1 = Đáp án A (options[0])
- 2 = Đáp án B (options[1])  
- 3 = Đáp án C (options[2])
- 4 = Đáp án D (options[3])

### ID câu hỏi:
- Nên sử dụng format: `{category}_{number}` (vd: geo_001, math_001)
- Phải duy nhất trong toàn bộ file

### Chuyên đề (category):
- Sử dụng tên tiếng Việt có dấu
- Ví dụ: "Địa lý", "Toán học", "Hóa học", "Văn học", "Lịch sử"

## 5. Cách sử dụng trong ứng dụng

1. **Nhập file**: Chọn "Nhập câu hỏi" và upload file JSON hoặc CSV
2. **Xuất file**: Click "Xuất JSON" để tải về file câu hỏi hiện tại
3. **Kết quả**: Sau khi làm bài, click "Xuất kết quả CSV" để tải file kết quả

## 6. Mẹo tạo ngân hàng câu hỏi

- Sử dụng Excel/Google Sheets để tạo CSV, sau đó xuất ra
- Nhóm câu hỏi theo chuyên đề để dễ quản lý
- Viết giải thích chi tiết để học sinh hiểu rõ
- Kiểm tra kỹ đáp án đúng trước khi nhập vào hệ thống