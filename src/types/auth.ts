export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  full_name: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'user';
}
