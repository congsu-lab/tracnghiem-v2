import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SessionTerminatedModalProps {
  onClose: () => void;
}

export const SessionTerminatedModal: React.FC<SessionTerminatedModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Phiên đăng nhập đã kết thúc</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Tài khoản của bạn đã được đăng nhập từ thiết bị khác.
          </p>
          <p className="text-gray-600 text-sm">
            Để bảo mật tài khoản, bạn đã bị đăng xuất khỏi thiết bị này. Vui lòng đăng nhập lại để tiếp tục.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Mỗi tài khoản chỉ được đăng nhập trên một thiết bị tại một thời điểm.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-[#A50034] text-white rounded-lg hover:bg-[#8a0029] transition-colors font-medium"
        >
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
};
