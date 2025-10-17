import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { Question } from '../types/quiz';

interface QuickAnswerLookupProps {
  questions: Question[];
}

interface SearchResult {
  question: Question;
  index: number;
  similarity: number;
}

export const QuickAnswerLookup: React.FC<QuickAnswerLookupProps> = ({ questions }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const categories = ['all', ...new Set(questions.map(q => q.category))];

  // Hàm chuẩn hóa văn bản: loại bỏ dấu câu và khoảng trắng thừa
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:()"\[\]{}]/g, ' ') // Thay dấu câu bằng khoảng trắng
      .replace(/\s+/g, ' ') // Gộp nhiều khoảng trắng thành 1
      .trim();
  };

  // Tìm kiếm mờ với tính điểm độ tương đồng
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);

    // Khớp chính xác
    if (s1 === s2) return 1.0;

    // Khớp chứa chuỗi con - ưu tiên cao nhất
    if (s1.includes(s2)) {
      return 0.95;
    }
    if (s2.includes(s1)) {
      return 0.9;
    }

    // Độ tương đồng dựa trên từ
    const words1 = s1.split(/\s+/).filter(w => w.length > 0);
    const words2 = s2.split(/\s+/).filter(w => w.length > 0);

    let matchedWords = 0;
    const searchWords = words2.filter(w => w.length >= 1); // Từ khóa tìm kiếm (chấp nhận từ 1 ký tự)

    for (const searchWord of searchWords) {
      for (const word of words1) {
        if (word.length < 1) continue;
        // Đối với từ ngắn (1-2 ký tự), chỉ khớp chính xác hoặc chứa đầy đủ
        if (searchWord.length <= 2) {
          if (word === searchWord || word.includes(searchWord)) {
            matchedWords++;
            break;
          }
        } else {
          // Đối với từ dài, tìm kiếm mờ hơn
          if (word.includes(searchWord) || searchWord.includes(word)) {
            matchedWords++;
            break;
          }
        }
      }
    }

    // Nếu không có từ nào khớp
    if (matchedWords === 0) return 0;

    // Tính điểm dựa trên tỷ lệ từ khớp so với từ khóa tìm kiếm (không phải tổng số từ)
    const matchRatio = matchedWords / searchWords.length;

    // Nếu khớp >= 50% từ khóa thì cho điểm cao
    if (matchRatio >= 0.5) {
      return 0.6 + (matchRatio * 0.3); // 0.6 - 0.9
    }

    return matchRatio * 0.5; // 0 - 0.5
  };

  const fuzzySearch = (keyword: string, category: string): SearchResult[] => {
    const results: SearchResult[] = [];

    questions.forEach((question, index) => {
      // Lọc theo chuyên đề
      if (category !== 'all' && question.category !== category) {
        return;
      }

      // Tính độ tương đồng cho câu hỏi
      const questionSimilarity = calculateSimilarity(question.question, keyword);

      // Tính độ tương đồng cho các đáp án
      let maxOptionSimilarity = 0;
      question.options.forEach(option => {
        const optionSimilarity = calculateSimilarity(option, keyword);
        maxOptionSimilarity = Math.max(maxOptionSimilarity, optionSimilarity);
      });

      const similarity = Math.max(questionSimilarity, maxOptionSimilarity);

      // Chỉ lấy kết quả có độ tương đồng > 0.15 (15%)
      if (similarity > 0.15) {
        results.push({
          question,
          index: index + 1,
          similarity
        });
      }
    });

    // Sắp xếp theo độ tương đồng (cao nhất trước) và trả về top 3
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  };

  useEffect(() => {
    if (searchKeyword.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const keyword = searchKeyword.toLowerCase().trim();

    // Sử dụng tìm kiếm mờ
    const results = fuzzySearch(keyword, selectedCategory);

    setSearchResults(results);
    setIsSearching(false);
  }, [searchKeyword, selectedCategory, questions]);

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript;

      // Chuẩn hóa văn bản: xóa khoảng trắng thừa, dấu câu cuối
      transcript = transcript.trim();
      transcript = transcript.replace(/[.,!?;:]$/g, '');
      transcript = transcript.trim();

      setSearchKeyword(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        alert('Không nhận được giọng nói. Vui lòng thử lại.');
      } else if (event.error === 'not-allowed') {
        alert('Vui lòng cho phép truy cập microphone để sử dụng tính năng này.');
      } else {
        alert('Lỗi nhận dạng giọng nói. Vui lòng thử lại.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    // Chuẩn hóa từ khóa và tách thành các từ
    const normalizedKeyword = normalizeText(keyword);
    const words = normalizedKeyword.split(/\s+/).filter(w => w.length >= 1);
    if (words.length === 0) return text;

    let highlightedText = text;
    words.forEach(word => {
      // Escape ký tự đặc biệt trong regex và tìm từ kể cả khi có dấu câu xung quanh
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 font-semibold">$1</mark>'
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Search className="w-5 h-5" />
        Tra cứu nhanh đáp án
      </h2>

      <div className="space-y-4">
        {/* Ô tìm kiếm */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Nhập từ khóa hoặc nói để tìm kiếm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Tìm kiếm bằng giọng nói"
              >
                {isListening ? (
                  <div className="relative">
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  </div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:min-w-[200px] w-full md:w-auto"
          >
            <option value="all">Tất cả chuyên đề</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái nhận dạng giọng nói */}
        {isListening && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <Mic className="w-5 h-5 text-red-600 animate-pulse" />
              <span className="text-red-800 font-medium">Đang lắng nghe...</span>
            </div>
            <button
              onClick={stopVoiceRecognition}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Dừng
            </button>
          </div>
        )}

        {/* Gợi ý tìm kiếm */}
        {searchKeyword.trim().length > 0 && searchKeyword.trim().length < 1 && (
          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
            Vui lòng nhập ít nhất 1 ký tự để tìm kiếm
          </div>
        )}

        {/* Thông báo không tìm thấy kết quả */}
        {searchKeyword.trim().length >= 1 && searchResults.length === 0 && !isSearching && (
          <div className="text-sm text-gray-600 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-800 mb-1">❌ Không tìm thấy kết quả</p>
            <p className="text-yellow-700">
              Không tìm thấy câu hỏi phù hợp với từ khóa "{searchKeyword}"
              {selectedCategory !== 'all' && ` trong chuyên đề "${selectedCategory}"`}.
            </p>
            <p className="text-yellow-700 mt-2">
              💡 Vui lòng thử lại với từ khóa khác.
            </p>
          </div>
        )}

        {/* Kết quả tìm kiếm */}
        {searchResults.length > 0 && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="text-sm text-gray-600 mb-2">
              Tìm thấy <strong>{searchResults.length}</strong> kết quả (Top 3 câu hỏi phù hợp nhất)
            </div>

            {searchResults.map(({ question, index, similarity }) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold text-xs flex-shrink-0">
                    {index}
                  </span>
                  <p className="text-gray-900 text-sm leading-relaxed flex-1">
                    {highlightText(question.question, searchKeyword.trim())}
                  </p>
                </div>

                <div className="space-y-1.5 ml-0 md:ml-12">
                  {question.options.map((option, optIndex) => {
                    const isCorrect = optIndex === question.correctAnswer;
                    return (
                      <div
                        key={optIndex}
                        className={`p-2 rounded-lg ${
                          isCorrect
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-sm font-semibold flex-shrink-0 ${
                            isCorrect ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span className={`text-sm flex-1 ${
                            isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'
                          }`}>
                            {highlightText(option, searchKeyword.trim())}
                          </span>
                          {isCorrect && (
                            <span className="text-green-600 font-semibold flex items-center gap-1 text-xs flex-shrink-0">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              <span className="hidden md:inline">Đáp án</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg ml-0 md:ml-12">
                    <p className="text-xs text-blue-900">
                      <strong>Giải thích:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
