import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';
import { sessionManager } from '../utils/sessionManager';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Kiểm tra session hiện tại - Tối ưu để tránh mất session khi reload
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    if (!isSupabaseConfigured() || !supabase) {
      console.log('⚠️ Supabase chưa được cấu hình, bỏ qua authentication');
      if (isMounted) {
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }
      return;
    }

    console.log('🔄 Bắt đầu kiểm tra session...');

    // Lấy session hiện tại với timeout dài hơn để tránh mất session khi reload chậm
    const getSession = async () => {
      try {
        console.log('🔄 Đang lấy session từ Supabase...');

        // Timeout 15s - đủ để restore session nhưng không để user chờ quá lâu
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('⚠️ Session timeout sau 15s, fallback to no auth');
            setAuthState({
              user: null,
              loading: false,
              error: null
            });
          }
        }, 15000);

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ Lỗi khi lấy session:', error);
          setAuthState({
            user: null,
            loading: false,
            error: null
          });
          return;
        }

        console.log('✅ Lấy session thành công:', session ? 'Có session' : 'Không có session');
        
        if (session?.user) {
          console.log('🔄 Có user trong session, đang lấy profile...');
          try {
            const userData = await getUserProfile(session.user.id, 10000, 2);
            console.log('✅ Lấy profile thành công:', userData);
            if (isMounted) {
              setAuthState({
                user: userData,
                loading: false,
                error: null
              });
            }
          } catch (profileError: any) {
            console.error('❌ Lỗi lấy profile:', profileError);
            // Nếu là lỗi timeout hoặc network, báo lỗi rõ ràng
            if (isMounted) {
              setAuthState({
                user: null,
                loading: false,
                error: 'Không thể kết nối database. Vui lòng thử lại.'
              });
            }
          }
        } else {
          console.log('ℹ️ Không có user trong session');
          if (isMounted) {
            setAuthState({
              user: null,
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        console.error('❌ Lỗi trong getSession:', error);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (isMounted) {
          setAuthState({
            user: null,
            loading: false,
            error: null
          });
        }
      }
    };

    // Chạy getSession
    getSession();

    console.log('🔄 Đang thiết lập listener cho auth state changes...');
    
    // Lắng nghe thay đổi auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'Có session' : 'Không có session');
        if (!isMounted) return;

        // Xử lý khi có SIGNED_OUT event - logout tất cả thiết bị khác
        if (event === 'SIGNED_OUT') {
          console.log('🚪 Đã bị đăng xuất từ thiết bị khác');
          setAuthState({
            user: null,
            loading: false,
            error: null
          });
          return;
        }

        // Sử dụng async block để tránh deadlock
        if (session?.user) {
          (async () => {
            try {
              const userData = await getUserProfile(session.user.id, 5000, 1);
              if (isMounted) {
                setAuthState({
                  user: userData,
                  loading: false,
                  error: null
                });
              }
            } catch (error) {
              console.error('❌ Lỗi lấy profile trong auth change:', error);
              if (isMounted) {
                setAuthState({
                  user: null,
                  loading: false,
                  error: 'Không thể tải thông tin người dùng'
                });
              }
            }
          })();
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null
          });
        }
      }
    );

    console.log('✅ Auth listener đã được thiết lập');
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Lấy thông tin profile người dùng với cache và retry
  const getUserProfile = async (userId: string, timeoutMs = 10000, retries = 2): Promise<User> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    console.log('🔄 Đang lấy profile cho user ID:', userId, '(timeout:', timeoutMs, 'ms, retries:', retries, ')');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Tạo timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.warn('⏱️ TIMEOUT lấy profile sau', timeoutMs, 'ms (attempt', attempt + 1, ')');
            reject(new Error('Timeout'));
          }, timeoutMs);
        });

        // Lấy profile từ database với timeout
        const profilePromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

        if (error) {
          console.error(`❌ Lỗi lấy profile từ DB (attempt ${attempt + 1}):`, error);
          if (attempt < retries) {
            console.log(`🔄 Retry sau 1 giây...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }

        if (!data) {
          console.warn('⚠️ Không tìm thấy profile, tạo mới...');

          // Lấy thông tin từ auth user
          const { data: authUser } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            email: authUser.user?.email || '',
            role: 'user' as const,
            full_name: authUser.user?.user_metadata?.full_name || authUser.user?.email || '',
            created_at: new Date().toISOString()
          };

          // Tạo profile trong DB
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([newProfile]);

          if (insertError) {
            console.error('❌ Không thể tạo profile:', insertError);
            throw insertError;
          }

          console.log('✅ Đã tạo profile mới:', newProfile);
          return newProfile;
        }

        console.log('✅ Lấy profile từ DB thành công:', data);
        console.log('🔍 Profile role:', data.role);
        return data;
      } catch (err: any) {
        if (attempt < retries && err.message === 'Timeout') {
          console.log(`🔄 Retry lần ${attempt + 2} sau 1 giây...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        console.error('❌ Lỗi khi lấy profile:', err);
        throw err;
      }
    }

    throw new Error('Không thể lấy profile sau nhiều lần thử');
  };

  // Đăng nhập tối ưu
  const login = async (credentials: LoginCredentials) => {
    if (!supabase) {
      throw new Error('Chưa cấu hình Supabase. Vui lòng cấu hình Supabase để sử dụng tính năng đăng nhập.');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Đang thử đăng nhập với email:', credentials.email);

      // Đăng nhập với timeout
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ Lỗi đăng nhập từ Supabase:', error);
        
        // Xử lý các lỗi phổ biến
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('❌ Email hoặc mật khẩu không đúng');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('📧 Email chưa được xác nhận');
        } else if (error.message?.includes('Too many requests')) {
          throw new Error('⏳ Quá nhiều lần thử. Vui lòng đợi 1 phút');
        } else if (error.message?.includes('timeout')) {
          throw new Error('⏱️ Kết nối chậm. Vui lòng thử lại');
        } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
          throw new Error('🌐 Lỗi kết nối mạng');
        }
        
        throw error;
      }

      console.log('✅ Đăng nhập Supabase thành công:', data);

      if (data.user && data.session) {
        console.log('🔄 Đang lấy thông tin profile user...');

        // Lấy profile từ database với timeout dài hơn (10s) và retry
        const userData = await getUserProfile(data.user.id, 10000, 2);
        console.log('✅ Lấy profile thành công:', userData);

        // Cập nhật state NGAY LẬP TỨC
        setAuthState({
          user: userData,
          loading: false,
          error: null
        });

        console.log('✅ Đã cập nhật auth state với role:', userData.role);

        return userData;
      } else {
        throw new Error('Không nhận được thông tin user từ Supabase');
      }
    } catch (error) {
      console.error('❌ Chi tiết lỗi đăng nhập:', error);
      
      let errorMessage = 'Lỗi đăng nhập không xác định';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = '⏱️ Kết nối chậm. Kiểm tra mạng và thử lại';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = '🌐 Không thể kết nối server';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  // Đăng ký tối ưu
  const register = async (credentials: RegisterCredentials) => {
    if (!supabase) {
      throw new Error('Chưa cấu hình Supabase. Vui lòng cấu hình Supabase để sử dụng tính năng đăng ký.');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Bắt đầu đăng ký với:', {
        email: credentials.email,
        role: credentials.role,
        full_name: credentials.full_name
      });

      // Timeout 10 giây cho register
      const registerPromise = supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name || '',
            role: credentials.role || 'user'
          }
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Register timeout after 10 seconds')), 10000);
      });
      
      const { data, error } = await Promise.race([registerPromise, timeoutPromise]) as any;

      if (error) throw error;
      
      console.log('✅ Đăng ký auth thành công:', data);

      if (data.user) {
        // Tạo profile cho user mới
        const newProfile = {
          id: data.user.id,
          email: credentials.email,
          role: credentials.role || 'user' as const,
          full_name: credentials.full_name || '',
          created_at: new Date().toISOString()
        };

        console.log('🔄 Tạo user profile:', newProfile);

        // Tạo profile trong background, không chờ
        supabase
          .from('user_profiles')
          .insert([newProfile])
          .then(({ error: profileError }) => {
            if (profileError) {
              console.warn('⚠️ Không thể tạo profile trong DB:', profileError);
            } else {
              console.log('✅ Tạo user profile thành công (background)');
            }
          })
          .catch(profileErr => console.warn('⚠️ Lỗi khi tạo profile:', profileErr));

        setAuthState({
          user: newProfile,
          loading: false,
          error: null
        });

        console.log('✅ Đăng ký hoàn tất thành công');
        return newProfile;
      }
    } catch (error) {
      console.error('❌ Lỗi đăng ký:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Lỗi đăng ký';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  // Đăng xuất
  const logout = async () => {
    if (!supabase) return;

    try {
      const currentUser = authState.user;
      const sessionId = sessionManager.getCurrentSessionId();

      if (currentUser && sessionId) {
        await sessionManager.endSession(currentUser.id, sessionId);
      }

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      setAuthState({
        user: null,
        loading: false,
        error: null
      });

      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });

        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      }

    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    }
  };

  // Cập nhật profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!supabase || !authState.user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) throw error;

      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }));
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: authState.user?.role === 'admin',
    isAuthenticated: !!authState.user,
    isSupabaseConfigured: isSupabaseConfigured()
  };
};