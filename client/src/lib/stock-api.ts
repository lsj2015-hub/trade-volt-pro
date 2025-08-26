import { StockInfo, StockPriceResponse } from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class StockAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'StockAPIError';
  }
}

export interface StockSearchParams {
  query: string;
  limit?: number;
}

export interface StockDetailParams {
  symbol: string;
  exchangeCode?: string;
}

export interface BatchStockParams {
  symbols: string[];
  exchangeCode?: string;
}

export class StockAPI {
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

        throw new StockAPIError(
          errorData.error?.message ||
            errorData.detail ||
            `HTTP ${response.status}`,
          response.status,
          errorData.error?.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof StockAPIError) {
        throw error;
      }

      // 네트워크 오류 등
      throw new StockAPIError(
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * 종목 검색
   * @param params 검색 파라미터
   * @returns 검색된 종목 리스트
   */
  static async searchStocks(params: StockSearchParams): Promise<StockInfo[]> {
    const { query, limit = 20 } = params;

    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.request<StockInfo[]>(
      `/api/v1/stocks/search?${searchParams.toString()}`
    );
  }

  /**
   * 종목 현재가 조회
   * @param symbol 종목코드
   * @param marketType 시장타입
   * @returns 현재가 정보
   */
  static async getStockPrice(
    symbol: string,
    marketType: 'DOMESTIC' | 'OVERSEAS'
  ): Promise<StockPriceResponse> {
    const searchParams = new URLSearchParams({
      market_type: marketType,
    });

    return this.request<StockPriceResponse>(
      `/api/v1/stocks/price/${symbol}?${searchParams.toString()}`
    );
  }
}
