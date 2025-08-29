import {
  BrokerResponse,
  CommissionRateRequest,
  CommissionRateResponse,
} from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class SystemAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'SystemAPIError';
  }
}

export interface ExchangeRateResponse {
  success: boolean;
  data: {
    usd_krw: number;
    updated_at: string;
  };
}

export interface MarketStatusResponse {
  success: boolean;
  data: {
    is_market_open: boolean;
    current_time_kst: string;
    market_open_time: string;
    market_close_time: string;
  };
}

export class SystemAPI {
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

        throw new SystemAPIError(
          errorData.detail ||
            errorData.error?.message ||
            `HTTP ${response.status}`,
          response.status,
          errorData.error?.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof SystemAPIError) {
        throw error;
      }

      // 네트워크 오류 등
      throw new SystemAPIError(
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * 지원하는 증권사 목록 조회
   * @returns 증권사 목록
   */
  static async getBrokers(): Promise<BrokerResponse[]> {
    return this.request<BrokerResponse[]>('/api/v1/system/brokers');
  }

  /**
   * 증권사별 수수료율 조회
   * @param request 수수료율 조회 요청
   * @returns 수수료율 정보
   */
  static async getCommissionRate(
    request: CommissionRateRequest
  ): Promise<CommissionRateResponse> {
    const searchParams = new URLSearchParams({
      broker_id: request.broker_id.toString(),
      market_type: request.market_type,
      transaction_type: request.transaction_type,
    });

    return this.request<CommissionRateResponse>(
      `/api/v1/system/commission?${searchParams.toString()}`
    );
  }

  /**
   * 주요 환율 정보 조회
   * @returns 환율 정보
   */
  static async getExchangeRates(): Promise<ExchangeRateResponse> {
    return this.request<ExchangeRateResponse>('/api/v1/system/exchange-rates');
  }

  /**
   * 시장 상태 정보 조회 (개장/폐장)
   * @returns 시장 상태 정보
   */
  static async getMarketStatus(): Promise<MarketStatusResponse> {
    return this.request<MarketStatusResponse>('/api/v1/system/market-status');
  }
}
