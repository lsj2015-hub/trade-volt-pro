import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class AuthAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'AuthAPIError';
  }
}

export class AuthAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new AuthAPIError(
        errorData.error?.message ||
          errorData.detail ||
          `HTTP ${response.status}`,
        response.status,
        errorData.error?.code
      );
    }

    return response.json();
  }

  // 로그인
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // 회원가입
  static async register(userData: RegisterRequest): Promise<User> {
    return this.request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // 현재 사용자 정보 조회
  static async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/v1/auth/me');
  }

  // 로그아웃
  static async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  // API 서버 연결 상태 확인
  static async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}
