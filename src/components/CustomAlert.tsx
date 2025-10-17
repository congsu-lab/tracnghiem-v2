import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface CustomAlertProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ title, message, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-[#9C1C1C] mb-3">
              {title}
            </h3>

            <p className="text-gray-700 text-base leading-relaxed mb-6">
              {message}
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-[#9C1C1C] text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-[#7A1616] active:bg-[#5A1010] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

let alertResolver: (() => void) | null = null;

export const showCustomAlert = (title: string, message: string): Promise<void> => {
  return new Promise((resolve) => {
    alertResolver = resolve;
    const event = new CustomEvent('showCustomAlert', {
      detail: { title, message }
    });
    window.dispatchEvent(event);
  });
};

export const closeCustomAlert = () => {
  if (alertResolver) {
    alertResolver();
    alertResolver = null;
  }
};
