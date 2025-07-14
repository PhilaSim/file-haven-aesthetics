
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface FileItem {
  id: string;
  user_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  public_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface FileShare {
  id: string;
  file_id: string;
  shared_by: string;
  shared_with: string;
  created_at: string;
}

export type Theme = 'light' | 'dark' | 'neo';

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  isAuthenticated: boolean;
  loading: boolean;
}
