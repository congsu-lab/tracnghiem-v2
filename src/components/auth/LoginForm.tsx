import React, { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useSimpleAuth } from '../../hooks/useSimpleAuth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onClose: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useSimpleAuth();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('quiz_app_email');
    const savedPassword = localStorage.getItem('quiz_app_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Form đăng nhập - bắt đầu với email:', email);
      await login(email, password);
      
      // Save credentials if remember is checked
      if (rememberPassword) {
        localStorage.setItem('quiz_app_email', email);
        localStorage.setItem('quiz_app_password', password);
      } else {
        localStorage.removeItem('quiz_app_email');
        localStorage.removeItem('quiz_app_password');
      }
      
      console.log('✅ Đăng nhập thành công, đóng modal');
      onClose();
    } catch (err) {
      console.error('❌ Lỗi trong form đăng nhập:', err);
      
      // Xử lý lỗi đơn giản và nhanh
      let errorMessage = 'Lỗi đăng nhập';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('Login timeout')) {
          errorMessage = '⏱️ Kết nối chậm, thử lại sau';
        } else if (err.message.includes('Invalid login credentials')) {
          errorMessage = '❌ Email hoặc mật khẩu sai';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = '🌐 Lỗi mạng, kiểm tra kết nối';
        } else if (err.message.includes('Database error')) {
          errorMessage = '🔧 Lỗi database, thử xóa cache trình duyệt (Ctrl+Shift+Del)';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill demo accounts for testing
  const fillDemoAccount = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@demo.com');
      setPassword('admin123');
    } else {
      setEmail('user@demo.com');
      setPassword('user123');
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-[#A50034]" />
        </div>
        <h2 className="text-2xl font-bold text-[#A50034]">Đăng nhập</h2>
        <p className="text-gray-700 mt-2 text-base font-semibold">Đăng nhập để truy cập hệ thống</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập email của bạn"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A50034]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-12 py-3 border border-[#C1B5B0] rounded-md focus:ring-2 focus:ring-[#A50034] focus:border-transparent"
              placeholder="Nhập mật khẩu"
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

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="rememberPassword"
            checked={rememberPassword}
            onChange={(e) => setRememberPassword(e.target.checked)}
            className="w-4 h-4 text-agribank-primary bg-gray-100 border-gray-300 rounded focus:ring-agribank-primary focus:ring-2 accent-agribank-primary"
          />
          <label htmlFor="rememberPassword" className="ml-2 text-sm text-gray-700">
            Ghi nhớ mật khẩu
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#A50034] text-white py-3 px-4 rounded-md hover:bg-[#8B002D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Chưa có tài khoản?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-[#A50034] hover:text-[#8B002D] font-medium"
          >
            Đăng ký ngay
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