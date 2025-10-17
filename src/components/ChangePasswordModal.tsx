import React, { useState } from 'react';
import { X, Eye, EyeOff, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    console.log('🔄 [ChangePassword] Bắt đầu đổi mật khẩu...');

    try {
      if (!supabase) {
        console.error('❌ [ChangePassword] Supabase không khả dụng');
        setIsLoading(false);
        setError('Supabase chưa được cấu hình');
        return;
      }

      console.log('🔄 [ChangePassword] Gọi RPC function...');

      // Sử dụng RPC function thay vì updateUser
      const { data, error: rpcError } = await supabase.rpc('change_user_password', {
        new_password: newPassword
      });

      console.log('📝 [ChangePassword] Kết quả RPC:', { data, error: rpcError });

      if (rpcError) {
        console.error('❌ [ChangePassword] Lỗi RPC:', rpcError);
        throw rpcError;
      }

      if (data && !data.success) {
        console.error('❌ [ChangePassword] Function trả về lỗi:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ [ChangePassword] Đổi mật khẩu thành công!');
      setIsLoading(false);
      setSuccess('Đổi mật khẩu thành công!');

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('❌ [ChangePassword] Exception:', err);
      setIsLoading(false);

      let errorMsg = 'Lỗi khi đổi mật khẩu';

      if (err.message) {
        errorMsg = err.message;
      } else if (err.error_description) {
        errorMsg = err.error_description;
      }

      setError(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-6 h-6 text-[#A50034]" />
            <h2 className="text-xl font-bold text-[#A50034]">Đổi mật khẩu</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#A50034] text-white rounded-md hover:bg-[#8B002D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
