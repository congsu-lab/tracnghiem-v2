import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, CreateUserData, UpdateUserData } from '../types/user';

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; message: string }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          status: 'active'
        });

      if (profileError) throw profileError;

      await fetchUsers();
      return { success: true, message: 'Tạo người dùng thành công' };
    } catch (err: any) {
      console.error('Error creating user:', err);
      return { success: false, message: err.message || 'Lỗi khi tạo người dùng' };
    }
  };

  const updateUser = async (userId: string, updates: UpdateUserData): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      return { success: true, message: 'Cập nhật người dùng thành công' };
    } catch (err: any) {
      console.error('Error updating user:', err);
      return { success: false, message: err.message || 'Lỗi khi cập nhật người dùng' };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      await fetchUsers();
      return { success: true, message: 'Xóa người dùng thành công' };
    } catch (err: any) {
      console.error('Error deleting user:', err);
      return { success: false, message: err.message || 'Lỗi khi xóa người dùng' };
    }
  };

  const resetPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return { success: true, message: 'Đặt lại mật khẩu thành công' };
    } catch (err: any) {
      console.error('Error resetting password:', err);
      return { success: false, message: err.message || 'Lỗi khi đặt lại mật khẩu' };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword
  };
}
