import { TransactionCreateRequest, TransactionResponse } from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class TradingAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'TradingAPIError';
  }
}

export class TradingAPI {
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

        throw new TradingAPIError(
          errorData.detail ||
            errorData.error?.message ||
            `HTTP ${response.status}`,
          response.status,
          errorData.error?.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TradingAPIError) {
        throw error;
      }

      // 네트워크 오류 등
      throw new TradingAPIError(
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * 매수/매도 주문 생성 (Holdings 자동 업데이트)
   * @param orderData 주문 생성 데이터
   * @returns 생성된 거래 정보
   */
  static async createOrder(
    orderData: TransactionCreateRequest
  ): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/v1/trading/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * 내 거래 내역 전체 조회
   * @returns 거래 내역 목록
   */
  static async getTradingHistory(): Promise<{
    success: boolean;
    data: TransactionResponse[];
    total_count: number;
  }> {
    return this.request<{
      success: boolean;
      data: TransactionResponse[];
      total_count: number;
    }>('/api/v1/trading/history');
  }

  /**
   * 특정 종목의 거래 내역 조회 (향후 추가 예정)
   * @param stockSymbol 종목 심볼
   * @returns 해당 종목의 거래 내역
   */
  static async getTradingHistoryByStock(
    stockSymbol: string
  ): Promise<TransactionResponse[]> {
    return this.request<TransactionResponse[]>(
      `/api/v1/trading/history/${stockSymbol}`
    );
  }
}
