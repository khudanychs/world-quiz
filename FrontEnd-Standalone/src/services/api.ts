// Mock API Service - No backend required!
// This is a standalone version that stores everything in localStorage

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  nickname_set?: boolean;
  google_id?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class MockApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_user');
  }

  private getStoredUsers(): Array<{ email: string; password: string; user: User }> {
    const stored = localStorage.getItem('mock_users');
    return stored ? JSON.parse(stored) : [];
  }

  private saveUser(email: string, password: string, user: User) {
    const users = this.getStoredUsers();
    users.push({ email, password, user });
    localStorage.setItem('mock_users', JSON.stringify(users));
  }

  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    await this.delay();
    
    const users = this.getStoredUsers();
    if (users.find(u => u.email === data.email)) {
      throw new Error('Email already registered');
    }

    const user: User = {
      id: Date.now(),
      username: data.username,
      email: data.email,
      nickname_set: true,
      created_at: new Date().toISOString(),
    };

    const token = `mock_token_${Date.now()}`;
    this.saveUser(data.email, data.password, user);
    this.setToken(token);
    localStorage.setItem('mock_user', JSON.stringify(user));

    return { user, token };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    await this.delay();
    
    const users = this.getStoredUsers();
    const found = users.find(u => u.email === data.email && u.password === data.password);
    
    if (!found) {
      throw new Error('Invalid email or password');
    }

    const token = `mock_token_${Date.now()}`;
    this.setToken(token);
    localStorage.setItem('mock_user', JSON.stringify(found.user));

    return { user: found.user, token };
  }

  async getProfile(): Promise<User> {
    await this.delay(200);
    
    const stored = localStorage.getItem('mock_user');
    if (!stored) {
      throw new Error('Not authenticated');
    }

    return JSON.parse(stored);
  }

  async setNickname(username: string): Promise<{ user: User }> {
    await this.delay();
    
    const stored = localStorage.getItem('mock_user');
    if (!stored) {
      throw new Error('Not authenticated');
    }

    const user = JSON.parse(stored);
    user.username = username;
    user.nickname_set = true;
    localStorage.setItem('mock_user', JSON.stringify(user));

    return { user };
  }

  getGoogleAuthUrl(): string {
    // Mock Google auth - just redirect to a mock callback
    return '/auth/callback?mock=true';
  }

  logout() {
    this.clearToken();
  }
}

export const apiService = new MockApiService();
