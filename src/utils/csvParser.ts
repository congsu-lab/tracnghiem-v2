import { Question } from '../types/quiz';

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  questions: Question[];
  errors: ParseError[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSV(csvContent: string): ParseResult {
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const questions: Question[] = [];
  const errors: ParseError[] = [];

  if (lines.length === 0) {
    throw new Error('File CSV rỗng');
  }

  const header = parseCSVLine(lines[0]);
  console.log('📋 CSV Header:', header);

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (fields.length < 6) {
      errors.push({ row: i + 1, message: `Không đủ cột (cần 6, có ${fields.length})` });
      continue;
    }

    const [question, option_a, option_b, option_c, option_d, correct_answer, explanation, category] = fields;

    if (!question || question === '') {
      errors.push({ row: i + 1, message: 'Thiếu câu hỏi' });
      continue;
    }

    const options = [option_a, option_b, option_c, option_d].filter(o => o && o !== '');
    if (options.length < 2) {
      errors.push({ row: i + 1, message: `Không đủ đáp án (cần ít nhất 2, có ${options.length})` });
      continue;
    }

    const correctAnswerNum = parseInt(correct_answer);
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

  if (errors.length > 0) {
    console.warn(`⚠️ Bỏ qua ${errors.length} dòng lỗi`);
  }

  if (questions.length === 0) {
    throw new Error(`Không tìm thấy câu hỏi hợp lệ. ${errors.length} dòng bị lỗi.`);
  }

  console.log(`✅ Import ${questions.length} câu hỏi${errors.length > 0 ? `, bỏ qua ${errors.length} dòng` : ''}`);
  return { questions, errors };
}

export function generateCSV(questions: Question[]): string {
  const header = 'question,option_a,option_b,option_c,option_d,correct_answer,explanation,category\n';

  const escapeField = (field: string) => {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const rows = questions.map(q => {
    return [
      escapeField(q.question),
      escapeField(q.options[0] || ''),
      escapeField(q.options[1] || ''),
      escapeField(q.options[2] || ''),
      escapeField(q.options[3] || ''),
      (q.correctAnswer + 1).toString(),
      escapeField(q.explanation || ''),
      escapeField(q.category)
    ].join(',');
  }).join('\n');

  return header + rows;
}
