import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Kiểm tra xem app đã được cài đặt chưa
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Lắng nghe sự kiện beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Lắng nghe sự kiện khi app được cài đặt
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Hiển thị prompt cài đặt
    deferredPrompt.prompt();

    // Đợi người dùng phản hồi
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Lưu vào localStorage để không hiển thị lại trong 7 ngày
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Không hiển thị nếu đã cài đặt hoặc không có prompt
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // Kiểm tra xem đã dismiss trong 7 ngày chưa
  const dismissedTime = localStorage.getItem('installPromptDismissed');
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return null;
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-[#A50034] overflow-hidden max-w-md mx-auto md:mx-0">
        <div className="bg-gradient-to-r from-[#A50034] to-[#8B0028] p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <img
                src="/logo-agribank-300x295.png"
                alt="Agribank Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base">
                Cài đặt ứng dụng
              </h3>
              <p className="text-white/90 text-xs">
                Truy cập nhanh từ màn hình chính
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#A50034] font-bold flex-shrink-0">✓</span>
              <span>Truy cập nhanh không cần mở trình duyệt</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#A50034] font-bold flex-shrink-0">✓</span>
              <span>Hoạt động offline, luyện thi mọi lúc</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#A50034] font-bold flex-shrink-0">✓</span>
              <span>Tiết kiệm bộ nhớ so với app thông thường</span>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-[#A50034] to-[#8B0028] text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            Cài đặt ngay
          </button>

          <button
            onClick={handleDismiss}
            className="w-full mt-2 text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
};
