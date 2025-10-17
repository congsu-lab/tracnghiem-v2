import React from 'react';
import { Clock, BookOpen } from 'lucide-react';

interface HeaderProps {
  mode: 'practice' | 'exam';
  timeRemaining: number;
  currentQuestion: number;
  totalQuestions: number;
  reviewMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  timeRemaining,
  currentQuestion,
  totalQuestions,
  reviewMode = false
}) => {
  const formatTime = (seconds: number) => {
    // Validate input với logging
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      console.warn('⚠️ Invalid time value in formatTime:', seconds);
      return '0:00';
    }
    
    // Đảm bảo seconds là số nguyên dương
    const totalSeconds = Math.max(0, Math.floor(seconds));
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    // Log để debug
    if (totalSeconds % 60 === 0) { // Log mỗi phút
      console.log('⏰ Time display:', {
        input: seconds,
        formatted: hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  
  return (
    <header className="bg-agribank-primary text-white px-3 py-2 md:px-4 md:py-3 border-b border-gray-300">
      <div className="flex justify-between items-center">
        {/* Mobile: Compact layout */}
        <div className="flex items-center gap-2 md:hidden flex-1 min-w-0">
          <BookOpen className="w-5 h-5" />
          <h1 className="text-sm font-medium truncate flex-1">
            Ứng Dụng Luyện Thi Trắc Nghiệm
          </h1>
        </div>
        
        {/* Desktop: Full layout */}
        <div className="hidden md:flex items-center gap-4">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-semibold">
            {reviewMode ? 'Ôn Luyện Câu Sai' : 'Ứng Dụng Luyện Thi Trắc Nghiệm'}
          </h1>
          {reviewMode ? (
            <span className="px-2 py-1 bg-orange-600 rounded-full text-sm">
              🔄 Ôn luyện câu sai
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-700 rounded-full text-sm">
              {mode === 'practice' ? 'Chế độ Ôn thi' : 'Chế độ Thi thật'}
            </span>
          )}
        </div>
        
        {/* Right side: Question counter + Timer */}
        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          {/* Mobile: Compact mode badge */}
          {reviewMode ? (
            <span className="md:hidden px-2 py-1 bg-orange-600 rounded-full text-xs">
              🔄 Ôn câu sai
            </span>
          ) : (
            <span className="md:hidden px-2 py-1 bg-gray-700 rounded-full text-xs">
              {mode === 'practice' ? 'Ôn thi' : 'Thi thật'}
            </span>
          )}
          
          <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
            <span className="text-xs md:text-base font-medium">
              Câu {currentQuestion}/{totalQuestions}
            </span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span 
              className={`font-mono text-sm md:text-lg font-bold ${timeRemaining < 300 ? 'text-red-400' : 'text-green-400'}`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};