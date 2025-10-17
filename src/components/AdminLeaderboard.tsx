import React, { useEffect, useState } from 'react';
import { Trophy, Trash2, RefreshCw, Clock, User } from 'lucide-react';
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
  last_attempt_at: string | null;
}

export const AdminLeaderboard: React.FC = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopUsers();
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

  const handleClearRankings = async () => {
    if (!window.confirm('⚠️ Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu xếp hạng?\n\nHành động này sẽ:\n- Xóa tất cả kết quả thi\n- Xóa tất cả xếp hạng\n- KHÔNG THỂ hoàn tác!\n\nBạn có muốn tiếp tục?')) {
      return;
    }

    if (!window.confirm('🚨 LẦN CUỐI: Bạn THỰC SỰ chắc chắn muốn xóa toàn bộ dữ liệu xếp hạng?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Count total records first
      const { count, error: countError } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Lỗi đếm records:', countError);
        throw countError;
      }

      if (!count || count === 0) {
        alert('✅ Không có dữ liệu nào để xóa!');
        setLoading(false);
        return;
      }

      // Delete in batches to avoid timeout
      const batchSize = 100;
      let deletedCount = 0;
      let hasMore = true;

      while (hasMore) {
        // Get a batch of records
        const { data: batch, error: fetchError } = await supabase
          .from('quiz_results')
          .select('id')
          .limit(batchSize);

        if (fetchError) {
          console.error('Lỗi lấy batch:', fetchError);
          throw fetchError;
        }

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        // Delete this batch
        const { error: deleteError } = await supabase
          .from('quiz_results')
          .delete()
          .in('id', batch.map(r => r.id));

        if (deleteError) {
          console.error('Lỗi xóa batch:', deleteError);
          throw deleteError;
        }

        deletedCount += batch.length;

        // If we got less than batch size, we're done
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }

      alert(`✅ Đã xóa thành công ${deletedCount} kết quả thi!`);
      await fetchTopUsers();
    } catch (err) {
      console.error('Lỗi khi xóa xếp hạng:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Lỗi khi xóa dữ liệu: ${errorMessage}`);
      alert('❌ Lỗi khi xóa dữ liệu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#A50034]" />
            <h2 className="text-xl font-semibold text-gray-800">Thống kê xếp hạng</h2>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#A50034]" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Thống kê xếp hạng (Top 10)</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTopUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleClearRankings}
            disabled={loading || topUsers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {topUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có dữ liệu xếp hạng
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Hạng</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Họ và tên</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700">Số lần thi</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700">Điểm TB</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700">Điểm cao nhất</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700">Thời gian tốt nhất</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Lần thi gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topUsers.map((entry) => (
                  <tr key={entry.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400" />}
                        {entry.rank === 3 && <Trophy className="w-5 h-5 text-amber-600" />}
                        <span className="font-semibold text-gray-900">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {entry.user_name || 'Chưa có tên'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {entry.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.total_attempts} lần
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-[#A50034]">
                        {entry.average_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-green-600">
                        {entry.best_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700">{formatTime(entry.best_time)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">
                        {formatDate(entry.last_attempt_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Lưu ý:</strong> Nút "Xóa tất cả" sẽ xóa toàn bộ dữ liệu kết quả thi và xếp hạng.
              Chỉ sử dụng khi test xong và chuẩn bị đưa vào hoạt động chính thức.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
