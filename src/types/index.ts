
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  userId: string;
  url: string;
  tags?: string[];
}

export type Theme = 'light' | 'dark' | 'neo';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}
