export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user';
}

export interface UpdateUserData {
  full_name?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'pending';
}

export interface RegisterUserData {
  email: string;
  password: string;
  full_name: string;
}
