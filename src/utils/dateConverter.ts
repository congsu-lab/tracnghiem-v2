/**
 * Convert Excel serial date number to dd/mm/yyyy format
 * Excel stores dates as numbers starting from 01/01/1900
 *
 * @param value - String or number that might be an Excel serial date
 * @returns Formatted date string if it's a serial date, otherwise original value
 */
export function convertExcelDate(value: string): string {
  if (!value) return value;

  const trimmed = value.trim();

  // Check if it's a number (Excel serial date)
  const num = parseFloat(trimmed);

  // Excel serial dates are typically between 1 (01/01/1900) and 60000 (year 2064)
  // Only convert if it's a valid serial date number (> 1000 to avoid converting small numbers like 60, 100)
  // Numbers below 1000 are more likely to be actual numbers (scores, quantities, etc.)
  if (!isNaN(num) && num >= 10000 && num < 60000 && trimmed === num.toString()) {
    try {
      // Excel date epoch starts at 1900-01-01
      // But Excel incorrectly treats 1900 as a leap year, so we need to account for that
      const excelEpoch = new Date(1900, 0, 1);
      const days = num - 1; // Serial 1 = Jan 1, 1900

      // Account for Excel's leap year bug (Feb 29, 1900 doesn't exist)
      const adjustedDays = num > 60 ? days - 1 : days;

      const date = new Date(excelEpoch.getTime() + adjustedDays * 24 * 60 * 60 * 1000);

      // Format as dd/mm/yyyy
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error converting Excel date:', error);
      return value;
    }
  }

  // Not a serial date, return as-is
  return value;
}

/**
 * Convert Excel dates in a text string (questions, explanations, etc.)
 * Finds potential Excel serial dates and converts them to dd/mm/yyyy
 */
export function convertExcelDatesInText(text: string): string {
  if (!text) return text;

  // Find sequences of 5 digits that might be Excel dates (dates between 10000-59999)
  // This covers years 1927-2064
  // Only convert numbers >= 10000 to avoid converting small numbers
  return text.replace(/\b([1-5]\d{4})\b/g, (match) => {
    const num = parseInt(match);
    if (num >= 10000) {
      const converted = convertExcelDate(match);
      return converted !== match ? converted : match;
    }
    return match;
  });
}

/**
 * Convert Excel dates in question options array
 */
export function convertExcelDatesInOptions(options: string[]): string[] {
  return options.map(option => convertExcelDate(option));
}
