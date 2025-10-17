import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Flag, X } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reviewMode?: boolean;
  stats?: {
    answered: number;
    total: number;
    unanswered: number;
    marked: number;
  };
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reviewMode = false,
  stats
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              reviewMode ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                reviewMode ? 'text-orange-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewMode ? 'Kết thúc ôn luyện?' : 'Nộp bài thi?'}
              </h3>
              <p className="text-sm text-gray-600">
                {reviewMode 
                  ? 'Bạn có chắc chắn muốn kết thúc phần ôn luyện câu sai không?'
                  : 'Bạn có chắc chắn muốn nộp bài không?'
                }
              </p>
            </div>
          </div>

          {!reviewMode && stats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                Thống kê hiện tại:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Đã trả lời:
                  </span>
                  <span className="font-medium">{stats.answered}/{stats.total} câu</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    Chưa trả lời:
                  </span>
                  <span className="font-medium">{stats.unanswered} câu</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Flag className="w-3 h-3 text-yellow-600" />
                    Đã đánh dấu:
                  </span>
                  <span className="font-medium">{stats.marked} câu</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium ${
                reviewMode 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {reviewMode ? 'Kết thúc' : 'Nộp bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};