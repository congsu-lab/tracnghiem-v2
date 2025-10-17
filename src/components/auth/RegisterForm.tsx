import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, User, Lock, Mail, Shield } from 'lucide-react';
import { useSimpleAuth } from '../../hooks/useSimpleAuth';
import { showCustomAlert } from '../CustomAlert';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'user' as 'admin' | 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useSimpleAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData.fullName);
      await showCustomAlert(
        'Đăng ký thành công',
        'Tài khoản của bạn đã được gửi để phê duyệt. Vui lòng chờ quản trị viên xác nhận.'
      );
      onSwitchToLogin();
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        switch (err.code) {
          case 'email_provider_disabled':
            setError('Đăng ký bằng email đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để kích hoạt tính năng này trong Supabase Dashboard.');
            break;
          case 'signup_disabled':
            setError('Đăng ký tài khoản mới đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
            break;
          case 'email_address_invalid':
            setError('Địa chỉ email không hợp lệ.');
            break;
          case 'password_too_short':
            setError('Mật khẩu quá ngắn. Vui lòng nhập ít nhất 6 ký tự.');
            break;
          case 'user_already_exists':
            setError('Email này đã được sử dụng để đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
            break;
          default:
            setError(err instanceof Error ? err.message : 'Lỗi đăng ký');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Lỗi đăng ký');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-[#A50034]" />
        </div>
        <h2 className="text-2xl font-bold text-[#A50034]">Đăng ký</h2>
        <p className="text-gray-700 mt-2 text-base font-semibold">Tạo tài khoản mới</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập họ và tên"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập email của bạn"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại tài khoản (chỉ có thể đăng ký User)
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled
              className="w-full pl-10 pr-4 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
            >
              <option value="user">Người dùng (Ôn thi & Thi thử)</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 Chỉ có thể đăng ký tài khoản Người dùng. Để có tài khoản Quản trị viên, vui lòng liên hệ admin.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="w-full pl-10 pr-12 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              className="w-full pl-10 pr-12 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập lại mật khẩu"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#A50034] text-white py-3 px-4 rounded-md hover:bg-[#8B002D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#A50034] hover:text-[#8B002D] font-medium"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[#A50034] text-xs font-semibold mb-1 whitespace-nowrap">
          © 2025 Agribank CN Cư M'gar Bắc Đắk Lắk
        </p>
        <p className="text-[#A50034] text-xs">
          Địa chỉ: 124 Hùng vương, X. Quảng Phú, T. Đắk Lắk
        </p>
        <p className="text-[#A50034] text-xs">
          📞 Hotline: 0972 116 275 | ✉️ Email: congsu@gmail.com
        </p>
      </div>
    </div>
  );
};