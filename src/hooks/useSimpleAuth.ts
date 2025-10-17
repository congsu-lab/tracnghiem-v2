import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useSimpleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔄 Checking auth...');

      if (!supabase) {
        setAuthState({ user: null, loading: false, error: null });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        const user: User = profile ? {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          created_at: profile.created_at
        } : {
          id: session.user.id,
          email: session.user.email || '',
          role: 'user',
          full_name: session.user.email || '',
          created_at: new Date().toISOString()
        };

        console.log('✅ User loaded:', user);
        setAuthState({ user, loading: false, error: null });
      } else {
        console.log('ℹ️ No session');
        setAuthState({ user: null, loading: false, error: null });
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      setAuthState({ user: null, loading: false, error: null });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔄 Logging in:', email);
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user returned');
      }

      console.log('🔍 Fetching profile for user ID:', data.user.id);

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      console.log('🔍 Profile query result:', { profile, profileError });

      if (profile && profile.status === 'pending') {
        await supabase.auth.signOut();
        throw new Error('Tài khoản của bạn chưa được duyệt. Vui lòng chờ quản trị viên phê duyệt.');
      }

      if (profile && profile.status === 'inactive') {
        await supabase.auth.signOut();
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      }

      const user: User = profile ? {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        created_at: profile.created_at
      } : {
        id: data.user.id,
        email: data.user.email || '',
        role: 'user',
        full_name: data.user.email || '',
        created_at: new Date().toISOString()
      };

      console.log('✅ Login success:');
      console.log('   - User ID:', user.id);
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - Full Name:', user.full_name);
      console.log('   - RAW profile from DB:', profile);
      setAuthState({ user, loading: false, error: null });

      return user;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMsg = error.message || 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMsg }));
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🔄 Registering:', email);
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user returned');
      }

      await supabase.auth.signOut();

      console.log('✅ Register success - account pending approval');
      setAuthState({ user: null, loading: false, error: null });

      return null;
    } catch (error: any) {
      console.error('❌ Register error:', error);
      const errorMsg = error.message || 'Registration failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMsg }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out...');

      if (supabase) {
        await supabase.auth.signOut();
      }

      setAuthState({ user: null, loading: false, error: null });
      console.log('✅ Logout success');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setAuthState({ user: null, loading: false, error: null });
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.role === 'admin',
    isSupabaseConfigured: !!supabase,
    login,
    register,
    logout
  };
}
