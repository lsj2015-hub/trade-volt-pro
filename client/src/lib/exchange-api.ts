const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ExchangeAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ExchangeAPIError';
  }
}

export interface ExchangeRateResponse {
  currency_code: string;
  exchange_rate: number;
  search_date: string;
  updated_at: string;
}

export class ExchangeAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 인증 토큰 추가
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ExchangeAPIError(
          errorData.detail || `HTTP ${response.status}`,
          response.status
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ExchangeAPIError) {
        throw error;
      }
      throw new ExchangeAPIError(
        '환율 정보를 가져올 수 없습니다.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * USD/KRW 환율 조회
   */
  static async getUsdKrwRate(): Promise<ExchangeRateResponse> {
    return this.request<ExchangeRateResponse>('/api/v1/exchange/usd-krw');
  }
}
