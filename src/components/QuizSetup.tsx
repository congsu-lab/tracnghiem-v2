import React, { useState } from 'react';
import { Upload, Download, Settings, Play, Database, Trash2, Plus, HelpCircle } from 'lucide-react';
import { Question, QuizConfig } from '../types/quiz';
import { parseCSV } from '../utils/csvParser';
import { parseXLSX, generateXLSX, generateSampleXLSX } from '../utils/xlsxParser';

interface QuizSetupProps {
  questions: Question[];
  loading: boolean;
  error: string | null;
  onQuestionsImport: (questions: Question[], replaceAll?: boolean) => void;
  onClearQuestions: () => void;
  onStartQuiz: (config: QuizConfig) => void;
  isSupabaseConfigured?: boolean;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({
  questions,
  loading,
  error,
  onQuestionsImport,
  onClearQuestions,
  onStartQuiz,
  isSupabaseConfigured = false
}) => {
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [timeLimit, setTimeLimit] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [selectedCategories, setSelectedCategories] = useState<{ [key: string]: number }>({});
  const [importMode, setImportMode] = useState<'replace' | 'add'>('add');

  const categories = [...new Set(questions.map(q => q.category))];

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`📁 File được chọn: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    if (file.name.endsWith('.xlsx')) {
      // Xử lý file Excel
      parseXLSX(file)
        .then(result => {
          const { questions: importedQuestions, errors } = result;
          console.log(`✅ Excel parsed: ${importedQuestions.length} câu hỏi hợp lệ, ${errors.length} lỗi`);

          // Hiển thị lỗi nếu có
          if (errors.length > 0) {
            const maxShow = 20;
            const errorList = errors.slice(0, maxShow).map(e => `  • Dòng ${e.row}: ${e.message}`).join('\n');
            const moreErrors = errors.length > maxShow ? `\n  ... và ${errors.length - maxShow} lỗi khác` : '';

            alert(`⚠️ Tìm thấy ${errors.length} dòng lỗi (đã bỏ qua):\n\n${errorList}${moreErrors}\n\n✅ Import thành công ${importedQuestions.length} câu hỏi hợp lệ.`);
          }

          if (importedQuestions.length >= 1000) {
            const confirmMsg = `⚠️ File có ${importedQuestions.length} câu hỏi.\n\n⏱️ Quá trình import có thể mất vài phút.\n\n✅ Vui lòng KHÔNG đóng trình duyệt trong khi đang import.\n\nBạn có muốn tiếp tục không?`;
            if (!confirm(confirmMsg)) {
              return;
            }
            alert(`⏳ Đang import ${importedQuestions.length} câu hỏi...\n\n✓ Vui lòng chờ và theo dõi Console log để xem tiến trình.\n✓ KHÔNG đóng trình duyệt cho đến khi hoàn tất.`);
          }

          onQuestionsImport(importedQuestions, importMode === 'replace');
        })
        .catch(error => {
          console.error('❌ Chi tiết lỗi:', error);
          alert(`❌ Lỗi đọc file Excel: ${error.message}\n\n💡 Kiểm tra:\n- File có đúng định dạng không?\n- Các cột bắt buộc: question, option_a, option_b, option_c, option_d, correct_answer, category\n- Đáp án đúng phải là số 1-4`);
        });
    } else {
      // Xử lý file JSON/CSV như cũ
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          console.log(`📄 File content length: ${content.length} characters`);
          
          let importedQuestions: Question[];

          if (file.name.endsWith('.json')) {
            importedQuestions = JSON.parse(content);
            console.log(`✅ JSON parsed: ${importedQuestions.length} câu hỏi`);
          } else if (file.name.endsWith('.csv')) {
            const result = parseCSV(content);
            importedQuestions = result.questions;
            console.log(`✅ CSV parsed: ${importedQuestions.length} câu hỏi`);

            if (result.errors.length > 0) {
              const maxShow = 20;
              const errorList = result.errors.slice(0, maxShow).map(e => `  • Dòng ${e.row}: ${e.message}`).join('\n');
              const moreErrors = result.errors.length > maxShow ? `\n  ... và ${result.errors.length - maxShow} lỗi khác` : '';
              alert(`⚠️ Tìm thấy ${result.errors.length} dòng lỗi (đã bỏ qua):\n\n${errorList}${moreErrors}\n\n✅ Import thành công ${importedQuestions.length} câu hỏi hợp lệ.`);
            }
          } else {
            throw new Error('Định dạng file không được hỗ trợ');
          }

          if (importedQuestions.length >= 1000) {
            const confirmMsg = `⚠️ File có ${importedQuestions.length} câu hỏi.\n\n⏱️ Quá trình import có thể mất vài phút.\n\n✅ Vui lòng KHÔNG đóng trình duyệt trong khi đang import.\n\nBạn có muốn tiếp tục không?`;
            if (!confirm(confirmMsg)) {
              return;
            }
            alert(`⏳ Đang import ${importedQuestions.length} câu hỏi...\n\n✓ Vui lòng chờ và theo dõi Console log để xem tiến trình.\n✓ KHÔNG đóng trình duyệt cho đến khi hoàn tất.`);
          }

          onQuestionsImport(importedQuestions, importMode === 'replace');
        } catch (error) {
          alert('Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('⚠️ Bạn có chắc chắn muốn xóa TẤT CẢ câu hỏi trong cơ sở dữ liệu?\n\nHành động này KHÔNG THỂ hoàn tác!')) {
      await onClearQuestions();
      alert('✅ Đã xóa tất cả câu hỏi khỏi cơ sở dữ liệu!');
    }
  };

  const handleExportExcel = () => {
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để xuất!');
      return;
    }
    try {
      generateXLSX(questions);
      alert(`Đã xuất thành công ${questions.length} câu hỏi ra file Excel!`);
    } catch (error) {
      alert('Lỗi khi xuất file Excel!');
    }
  };

  const downloadSampleExcel = () => {
    try {
      generateSampleXLSX();
      alert('Đã tải xuống file Excel mẫu thành công!');
    } catch (error) {
      alert('Lỗi khi tạo file Excel mẫu!');
    }
  };

  const handleExportQuestions = () => {
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để xuất!');
      return;
    }
    try {
      const dataStr = JSON.stringify(questions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert(`Đã xuất thành công ${questions.length} câu hỏi ra file JSON!`);
    } catch (error) {
      alert('Lỗi khi xuất file JSON!');
    }
  };

  const downloadSampleJSON = () => {
    const sampleQuestions = [
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
      },
      {
        "id": "hist_001",
        "question": "Việt Nam giành độc lập vào năm nào?",
        "options": ["1945", "1954", "1975", "1976"],
        "correctAnswer": 1,
        "explanation": "Việt Nam tuyên bố độc lập vào ngày 2/9/1945 với bản Tuyên ngôn độc lập do Chủ tịch Hồ Chí Minh đọc.",
        "category": "Lịch sử"
      },
      {
        "id": "lit_001",
        "question": "Ai là tác giả của tác phẩm 'Truyện Kiều'?",
        "options": ["Nguyễn Du", "Hồ Xuân Hương", "Nguyễn Trãi", "Lý Thái Tổ"],
        "correctAnswer": 1,
        "explanation": "Nguyễn Du (1765-1820) là tác giả của kiệt tác 'Truyện Kiều', được coi là đỉnh cao của văn học Việt Nam.",
        "category": "Văn học"
      }
    ];
    
    try {
      const dataStr = JSON.stringify(sampleQuestions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-questions.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Lỗi khi tạo file JSON mẫu!');
    }
  };

  const downloadSampleCSV = () => {
    try {
      const csvContent = `question,option_a,option_b,option_c,option_d,correct_answer,explanation,category
"Thủ đô của Việt Nam là thành phố nào?","Thành phố Hồ Chí Minh","Hà Nội","Đà Nẵng","Cần Thơ",2,"Hà Nội là thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam từ năm 1976, là trung tâm chính trị - hành chính của cả nước.","Địa lý Việt Nam"
"Kết quả của phép tính 15 + 25 × 2 là bao nhiêu?","80","65","55","70",2,"Theo thứ tự ưu tiên của các phép tính:
Bước 1: 25 × 2 = 50
Bước 2: 15 + 50 = 65","Toán học cơ bản"
"Nguyên tố hóa học nào có ký hiệu là ""O""?","Oxi (Oxygen)","Vàng (Gold)","Bạc (Silver)","Sắt (Iron)",1,"Oxi (Oxygen) có ký hiệu hóa học là O, là nguyên tố thiết yếu cho sự sống và quá trình hô hấp của con người.","Hóa học"
"Việt Nam tuyên bố độc lập vào ngày nào?","2 tháng 9 năm 1945","30 tháng 4 năm 1975","19 tháng 8 năm 1945","2 tháng 7 năm 1976",1,"Ngày 2 tháng 9 năm 1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn độc lập tại Quảng trường Ba Đình, Hà Nội, tuyên bố nước Việt Nam Dân chủ Cộng hòa ra đời.","Lịch sử Việt Nam"
"Tác giả của tác phẩm ""Truyện Kiều"" là ai?","Nguyễn Du","Hồ Xuân Hương","Nguyễn Trãi","Nguyễn Bỉnh Khiêm",1,"Nguyễn Du (1765-1820) là tác giả của kiệt tác ""Truyện Kiều"" (tên đầy đủ là ""Đoạn trường tân thanh""), được coi là đỉnh cao của văn học cổ điển Việt Nam.","Văn học Việt Nam"`;
    
      // Thêm UTF-8 BOM để hỗ trợ tiếng Việt
      const BOM = '\uFEFF';
      const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-questions.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Lỗi khi tạo file CSV mẫu!');
    }
  };

  const handleStartQuiz = () => {
    const config: QuizConfig = {
      mode,
      timeLimit: timeLimit * 60, // Convert to seconds
      totalQuestions,
      categories: selectedCategories
    };
    onStartQuiz(config);
  };

  const updateCategoryCount = (category: string, count: number) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: count
    }));
  };

  const totalSelectedQuestions = Object.values(selectedCategories).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#A50034] text-white px-4 md:px-6 py-3 md:py-4 border-b border-gray-300">
        <div className="flex items-center gap-2 md:gap-4">
          <Settings className="w-5 h-5 md:w-6 md:h-6" />
          <h1 className="text-base md:text-xl font-semibold">Cấu hình bài thi</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-2 md:p-4">
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {/* Question Management */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Quản lý ngân hàng câu hỏi
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-start gap-2">
                  <span>❌</span>
                  <div>
                    <div className="font-medium whitespace-pre-line">{error}</div>
                  </div>
                </div>
              </div>
            )}
            
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chế độ nhập
                </label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'replace' | 'add')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="add">Thêm vào câu hỏi hiện có</option>
                  <option value="replace">Thay thế tất cả câu hỏi</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {importMode === 'add' ? 
                    '📝 Câu hỏi mới sẽ được thêm vào danh sách hiện có' : 
                    '🔄 Tất cả câu hỏi cũ sẽ bị xóa và thay thế bằng câu hỏi mới'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập câu hỏi (JSON/CSV/Excel)
                </label>
                <input
                  type="file"
                  disabled={loading}
                  accept=".json,.csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileImport}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleExportQuestions}
                  disabled={questions.length === 0 || loading}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Xuất</span> JSON
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={questions.length === 0 || loading}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Xuất</span> Excel
                </button>
                <button
                  onClick={handleClearDatabase}
                  disabled={questions.length === 0 || loading}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                >
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Xóa tất cả</span><span className="sm:hidden">Xóa</span>
                </button>

                <button
                  onClick={downloadSampleJSON}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">JSON mẫu</span><span className="sm:hidden">JSON</span>
                </button>
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">CSV mẫu</span><span className="sm:hidden">CSV</span>
                </button>
                <button
                  onClick={downloadSampleExcel}
                  className="flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Excel mẫu</span><span className="sm:hidden">Excel</span>
                </button>
              </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  <p>• JSON: Định dạng khuyến nghị, dễ chỉnh sửa</p>
                  <p>• CSV: Có thể mở bằng Excel, hỗ trợ UTF-8 với BOM</p>
                  <p>• Excel: Định dạng .xlsx, dễ chỉnh sửa, hỗ trợ đầy đủ tiếng Việt</p>
                  <p>• Tất cả file đều chứa câu hỏi mẫu đa chuyên đề</p>
                </div>
              </div>
            </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4" />
                  <span className="font-medium">Cơ sở dữ liệu:</span>
                </div>
                <p>📊 Tổng câu hỏi: <strong>{loading ? 'Đang tải...' : questions.length.toLocaleString()}</strong>
                </p>
                <p>Danh mục: <strong>{categories.length}</strong> chuyên đề</p>
                {loading && <p className="text-blue-600">🔄 Đang xử lý...</p>}
                {questions.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      📋 Xem chi tiết chuyên đề
                    </summary>
                    <div className="mt-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                      {categories.map(cat => {
                        const count = questions.filter(q => q.category === cat).length;
                        return (
                          <div key={cat} className="flex justify-between py-1">
                            <span className="truncate mr-2" title={cat}>{cat}</span>
                            <span className="font-mono">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Hidden Configuration Section - Only needed for reference, not displayed */}
        </div>
      </div>
      
    </div>
  );
};