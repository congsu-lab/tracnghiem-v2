import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  email: string;
  average_score: number;
  total_attempts: number;
  best_score: number;
  best_time: number;
  rank: number;
}

interface LeaderboardProps {
  refreshTrigger?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshTrigger }) => {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopUsers();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchTopUsers();

    const interval = setInterval(() => {
      fetchTopUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchTopUsers = async () => {
    if (!supabase) {
      setError('Chưa cấu hình Supabase');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('quiz_rankings')
        .select('*')
        .limit(10);

      if (fetchError) throw fetchError;

      setTopUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi lấy bảng xếp hạng:', err);
      setError('Không thể tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (rank: number) => {
    const titles = [
      '🏆 CAO THỦ VÀNG - THIÊN HẠ VÔ ĐỊCH',
      '🥈 CAO THỦ BẠC - ĐỘC CÔ CẦU BẠI',
      '🥉 CAO THỦ ĐỒNG - ĐẠI HIỆP LANG THANG',
      '⭐ CAO THỦ - TÂN MINH CHỦ VÕ LÂM',
      '⭐ CAO THỦ - ẨN THẾ CAO NHÂN',
      '⭐ CAO THỦ - TRƯỞNG LÃO ĂN MAY',
      '⭐ CAO THỦ - ĐỆ NHẤT ĂN HÀNH',
      '⭐ CAO THỦ - CẦN VƯƠNG KIẾM KHÁCH',
      '⭐ CAO THỦ - ĐỒ ĐỆ VỪA XUỐNG NÚI',
      '⭐ CAO THỦ - TÂN THỦ TẬP TỄNH'
    ];
    return titles[rank - 1] || '⭐ CAO THỦ - TẬP TỄNH HỌC HỎI';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />;
      default:
        return <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      case 4:
      case 5:
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
      case 6:
      case 7:
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getTitleColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600';
      case 2:
        return 'text-gray-600';
      case 3:
        return 'text-amber-600';
      case 4:
      case 5:
        return 'text-blue-600';
      case 6:
      case 7:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-[#A50034]" />
          <h2 className="text-xl font-semibold text-gray-800">Bảng Xếp Hạng</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-[#A50034]" />
          <h2 className="text-xl font-semibold text-gray-800">Bảng Xếp Hạng</h2>
        </div>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (topUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-[#A50034]" />
          <h2 className="text-xl font-semibold text-gray-800">Bảng Xếp Hạng</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          Chưa có dữ liệu xếp hạng
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-[#A50034]" />
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">🏆 Bảng Xếp Hạng Cao Thủ</h2>
      </div>

      <div className="space-y-2">
        {topUsers.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md ${getRankBgColor(entry.rank)}`}
          >
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="text-lg font-bold text-gray-700 w-6 text-center">
                #{entry.rank}
              </div>
              {getRankIcon(entry.rank)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm md:text-base truncate">
                {entry.user_name || entry.email}
              </div>
              <div className={`text-xs md:text-sm font-medium ${getTitleColor(entry.rank)}`}>
                {getTitle(entry.rank)}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-lg md:text-xl font-bold text-green-600">
                {entry.average_score.toFixed(0)}% {entry.average_score >= 80 ? '✅' : '📊'}
              </div>
              <div className="text-xs text-gray-500">
                ⏱️ {formatTime(entry.best_time)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg">
        <p className="text-xs md:text-sm text-gray-700">
          <strong className="text-[#A50034]">🌟 Bảng Vinh Danh Cao Thủ:</strong> Top 10 thí sinh có điểm số cao nhất. Nếu điểm bằng nhau, thứ hạng được xếp theo thời gian hoàn thành nhanh nhất. Danh hiệu cao thủ sẽ tự động cập nhật theo thứ hạng!
        </p>
      </div>
    </div>
  );
};
