import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Target, Clock, Award, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface UserStats {
  rank: number;
  average_score: number;
  total_attempts: number;
  best_score: number;
  best_time: number;
  last_attempt_at: string | null;
}

interface RecentResult {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  time_spent: number;
  quiz_type: string;
  created_at: string;
}

export const UserStatistics: React.FC = () => {
  const { user } = useSimpleAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserStatistics();

    // Listen for quiz completion events
    const handleQuizCompleted = () => {
      fetchUserStatistics();
    };

    window.addEventListener('quizCompleted', handleQuizCompleted);
    return () => window.removeEventListener('quizCompleted', handleQuizCompleted);
  }, [user]);

  const fetchUserStatistics = async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user ranking
      const { data: rankingData, error: rankingError } = await supabase
        .from('quiz_rankings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rankingError) throw rankingError;

      // Get total number of users in rankings
      const { count, error: countError } = await supabase
        .from('quiz_rankings')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get recent 1 exam result only (not practice mode)
      const { data: resultsData, error: resultsError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_type', 'exam')
        .order('created_at', { ascending: false })
        .limit(1);

      if (resultsError) throw resultsError;

      setStats(rankingData);
      setTotalUsers(count || 0);
      setRecentResults(resultsData || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi lấy thống kê:', err);
      setError('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { text: 'Xuất sắc', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { text: 'Giỏi', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { text: 'Khá', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { text: 'Trung bình', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'Cần cố gắng', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-blue-600';
    return 'text-gray-700';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    return '📊';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#A50034]" />
          Thống kê của bạn
        </h2>
        <div className="text-center py-8 text-gray-500">
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#A50034]" />
          Thống kê của bạn
        </h2>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#A50034]" />
          Thống kê của bạn
        </h2>
        <div className="text-center py-8">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Bạn chưa có kết quả nào</p>
          <p className="text-sm text-gray-500">Hãy bắt đầu làm bài để xem thống kê và xếp hạng của mình!</p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(stats.average_score);
  const isTopRank = stats.rank <= 10;
  const percentile = totalUsers > 0 ? ((totalUsers - stats.rank + 1) / totalUsers * 100).toFixed(0) : 0;

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border-2 border-red-200 p-3 md:p-6">
        <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 text-gray-800">
          <Trophy className="w-4 h-4 md:w-5 md:h-5 text-[#A50034]" />
          Thống kê của bạn
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {/* Rank */}
          <div className="bg-white rounded-lg p-2 md:p-4 text-center border border-red-100 shadow-sm">
            <div className="text-xl md:text-3xl mb-1 md:mb-2">{getRankBadge(stats.rank)}</div>
            <div className={`text-lg md:text-2xl font-bold mb-0.5 md:mb-1 ${getRankColor(stats.rank)}`}>
              #{stats.rank}
            </div>
            <div className="text-[10px] md:text-xs text-gray-600">
              / {totalUsers}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
              Top {percentile}%
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg p-2 md:p-4 text-center border border-red-100 shadow-sm">
            <TrendingUp className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-[#A50034]" />
            <div className="text-lg md:text-2xl font-bold mb-0.5 md:mb-1 text-[#A50034]">
              {stats.average_score.toFixed(1)}%
            </div>
            <div className="text-[10px] md:text-xs text-gray-600">Điểm TB</div>
            <div className={`text-[9px] md:text-xs mt-0.5 md:mt-1 px-1.5 md:px-2 py-0.5 rounded-full ${performance.bg} ${performance.color} inline-block`}>
              {performance.text}
            </div>
          </div>

          {/* Best Score */}
          <div className="bg-white rounded-lg p-2 md:p-4 text-center border border-red-100 shadow-sm">
            <Award className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-[#A50034]" />
            <div className="text-lg md:text-2xl font-bold mb-0.5 md:mb-1 text-[#A50034]">
              {stats.best_score.toFixed(1)}%
            </div>
            <div className="text-[10px] md:text-xs text-gray-600">Điểm cao nhất</div>
            <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
              {stats.total_attempts} lần
            </div>
          </div>

          {/* Best Time */}
          <div className="bg-white rounded-lg p-2 md:p-4 text-center border border-red-100 shadow-sm">
            <Clock className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-[#A50034]" />
            <div className="text-lg md:text-2xl font-bold mb-0.5 md:mb-1 text-gray-800">
              {formatTime(stats.best_time)}
            </div>
            <div className="text-[10px] md:text-xs text-gray-600">TG tốt nhất</div>
          </div>
        </div>

        {/* Motivation Message */}
        <div className="mt-2 md:mt-4 p-2 md:p-3 bg-white rounded-lg border border-red-200">
          {isTopRank ? (
            <p className="text-xs md:text-sm text-center text-gray-700">
              🌟 <strong className="text-[#A50034]">Xuất sắc!</strong> Bạn đang ở Top {stats.rank}. Tiếp tục phấn đấu!
            </p>
          ) : stats.rank <= 20 ? (
            <p className="text-xs md:text-sm text-center text-gray-700">
              💪 <strong className="text-[#A50034]">Rất tốt!</strong> Còn cách Top 10 {stats.rank - 10} vị trí!
            </p>
          ) : (
            <p className="text-xs md:text-sm text-center text-gray-700">
              🎯 <strong className="text-[#A50034]">Hãy cố gắng!</strong> Làm thêm bài để cải thiện điểm!
            </p>
          )}
        </div>
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A50034]" />
            Lần thi thử gần nhất
          </h3>

          <div className="space-y-2">
            {recentResults.map((result, index) => {
              const resultPerf = getPerformanceLevel(result.percentage);
              const isImprovement = index < recentResults.length - 1 &&
                result.percentage > recentResults[index + 1].percentage;
              const isDecline = index < recentResults.length - 1 &&
                result.percentage < recentResults[index + 1].percentage;

              return (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full ${resultPerf.bg} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${resultPerf.color}`}>
                        {result.percentage.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${resultPerf.bg} ${resultPerf.color}`}>
                        {resultPerf.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.quiz_type === 'practice' ? '🎯 Ôn thi' : '📝 Thi thử'}
                      </span>
                      {isImprovement && (
                        <span className="text-xs text-green-600 flex items-center gap-0.5">
                          <ChevronUp className="w-3 h-3" />
                          Tiến bộ
                        </span>
                      )}
                      {isDecline && (
                        <span className="text-xs text-red-600 flex items-center gap-0.5">
                          <ChevronDown className="w-3 h-3" />
                          Giảm
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {result.correct_answers}/{result.total_questions} câu đúng • {formatTime(result.time_spent)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(result.created_at)}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className={`text-lg font-bold ${resultPerf.color}`}>
                      {result.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
