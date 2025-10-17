import React from 'react';
import { Send, List, ChevronLeft, ChevronRight } from 'lucide-react';

interface FooterProps {
  onSubmit: () => void;
  onShowQuestionList: () => void;
  currentQuestion: number;
  totalQuestions: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onSubmit,
  onShowQuestionList,
  currentQuestion,
  totalQuestions,
  onNavigate,
  canNavigatePrev,
  canNavigateNext
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-2 py-2 shadow-lg z-40">
      {/* Mobile Layout - Compact */}
      <div className="block md:hidden">
        {/* Row 1: Navigation buttons - Reduced size */}
        <div className="flex justify-between items-center gap-1 mb-1.5">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm min-h-[40px] flex-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>

          <button
            onClick={onShowQuestionList}
            className="flex items-center justify-center gap-1 px-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm min-h-[40px]"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm min-h-[40px] flex-1"
          >
            <span>Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Submit button - Reduced size */}
        <div className="flex justify-center">
          <button
            onClick={onSubmit}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-agribank-primary text-white rounded-lg hover:bg-agribank-dark transition-colors text-sm min-h-[40px] w-full"
          >
            <Send className="w-4 h-4" />
            Nộp bài
          </button>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between items-center">
        <button
          onClick={onSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-agribank-primary text-white rounded-lg hover:bg-agribank-dark transition-colors font-medium"
        >
          <Send className="w-5 h-5" />
          Nộp bài
        </button>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </button>
          
          <button
            onClick={onShowQuestionList}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <List className="w-5 h-5" />
            Danh sách câu hỏi
          </button>
          
          <button
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Tiếp
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};