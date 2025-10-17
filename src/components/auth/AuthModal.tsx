import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  console.log('🔄 AuthModal render:', { isOpen, mode });
  
  if (!isOpen) {
    console.log('❌ AuthModal: isOpen = false, không hiển thị modal');
    return null;
  }

  console.log('✅ AuthModal: Hiển thị modal');

  return (
    <div
      className="fixed inset-0 bg-pink-50 bg-opacity-95 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Đóng modal khi click vào backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center px-4 py-2 bg-agribank-primary border-b border-gray-200">
          <div className="flex items-center">
            <img
              src="/logo-agribank-300x295.png"
              alt="Agribank Logo"
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
          </div>
          <button
            onClick={() => {
              console.log('🔄 Đóng modal từ nút X');
              onClose();
            }}
            className="p-1.5 hover:bg-red-800 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm 
              onSwitchToRegister={() => setMode('register')}
              onClose={() => {
                console.log('🔄 Đóng modal từ LoginForm');
                onClose();
              }}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={() => setMode('login')}
              onClose={() => {
                console.log('🔄 Đóng modal từ RegisterForm');
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};