import * as XLSX from 'xlsx';
import { Question } from '../types/quiz';
import { convertExcelDate, convertExcelDatesInText } from './dateConverter';

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  questions: Question[];
  errors: ParseError[];
}

export function parseXLSX(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: false, cellNF: true, cellStyles: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');

        const rawData: any[][] = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row: any[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = firstSheet[cellAddress];

            if (!cell) {
              row.push('');
              continue;
            }

            if (R <= 3 && C <= 5) {
              console.log(`Cell ${cellAddress}:`, {
                type: cell.t,
                value: cell.v,
                formatted: cell.w,
                numberFormat: cell.z
              });
            }

            if (cell.t === 'n') {
              if (cell.z && (cell.z.includes('m/d') || cell.z.includes('d/m') || cell.z.includes('yy') || cell.z.includes('M/D'))) {
                if (cell.w) {
                  row.push(cell.w);
                } else {
                  row.push(cell.v.toString());
                }
              } else {
                row.push(cell.v.toString());
              }
            } else if (cell.w) {
              row.push(cell.w);
            } else if (cell.v != null) {
              row.push(cell.v.toString());
            } else {
              row.push('');
            }
          }
          rawData.push(row);
        }

        const jsonData = rawData;

        const questions: Question[] = [];
        const errors: ParseError[] = [];

        if (jsonData.length === 0) {
          reject(new Error('File Excel rỗng'));
          return;
        }

        const header = jsonData[0];
        console.log('📋 Excel Header:', header);

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          if (!row || row.length === 0 || !row.some(cell => cell != null && cell !== '')) {
            continue;
          }

          if (row.length < 6) {
            errors.push({ row: i + 1, message: `Không đủ cột (cần 6, có ${row.length})` });
            continue;
          }

          let [question, option_a, option_b, option_c, option_d, correct_answer, explanation, category] = row;

          const cleanValue = (val: any): string => {
            if (val == null) return '';
            return val.toString().trim();
          };

          question = cleanValue(question);
          option_a = cleanValue(option_a);
          option_b = cleanValue(option_b);
          option_c = cleanValue(option_c);
          option_d = cleanValue(option_d);
          explanation = cleanValue(explanation);
          category = cleanValue(category);

          if (!question || question === '') {
            errors.push({ row: i + 1, message: 'Thiếu câu hỏi' });
            continue;
          }

          const options = [option_a, option_b, option_c, option_d].filter(o => o !== '');
          if (options.length < 2) {
            errors.push({ row: i + 1, message: `Không đủ đáp án (cần ít nhất 2, có ${options.length})` });
            continue;
          }

          const correctAnswerNum = parseInt(correct_answer?.toString());
          if (isNaN(correctAnswerNum) || correctAnswerNum < 1 || correctAnswerNum > options.length) {
            errors.push({ row: i + 1, message: `Đáp án đúng không hợp lệ ("${correct_answer}")` });
            continue;
          }

          questions.push({
            id: `q-${Date.now()}-${i}`,
            question: question,
            options: options,
            correctAnswer: correctAnswerNum - 1,
            category: category || 'Uncategorized',
            explanation: explanation || undefined
          });
        }

        // Report errors
        if (errors.length > 0) {
          console.warn(`⚠️ Bỏ qua ${errors.length} dòng không hợp lệ`);
          errors.slice(0, 10).forEach(err => {
            console.warn(`  - Dòng ${err.row}: ${err.message}`);
          });
        }

        console.log(`✅ Import thành công ${questions.length} câu hỏi${errors.length > 0 ? `, bỏ qua ${errors.length} dòng lỗi` : ''}`);
        resolve({ questions, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export function generateXLSX(questions: Question[]): void {
  const data = [
    ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'category']
  ];

  questions.forEach(q => {
    data.push([
      q.question,
      q.options[0] || '',
      q.options[1] || '',
      q.options[2] || '',
      q.options[3] || '',
      (q.correctAnswer + 1).toString(),
      q.explanation || '',
      q.category
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, 'questions.xlsx');
}

export function generateSampleXLSX(): void {
  const sampleData = [
    ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'category'],
    ['Thủ đô của Việt Nam là thành phố nào?', 'Thành phố Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', '2', 'Hà Nội là thủ đô của Việt Nam', 'Địa lý'],
    ['Kết quả của 15 + 25 × 2 là bao nhiêu?', '80', '65', '55', '70', '2', 'Theo thứ tự ưu tiên: 25 × 2 = 50, 15 + 50 = 65', 'Toán học']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, 'sample-questions.xlsx');
}
