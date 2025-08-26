import {
  BrokerResponse,
  CommissionRateRequest,
  CommissionRateResponse,
  PortfolioSummaryResponse,
  TransactionCreateRequest,
  TransactionResponse
} from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class TransactionAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'TransactionAPIError';
  }
}

export class TransactionAPI {
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

        throw new TransactionAPIError(
          errorData.detail ||
            errorData.error?.message ||
            `HTTP ${response.status}`,
          response.status,
          errorData.error?.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TransactionAPIError) {
        throw error;
      }

      // 네트워크 오류 등
      throw new TransactionAPIError(
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * 활성화된 증권사 목록 조회
   * @returns 증권사 목록
   */
  static async getBrokers(): Promise<BrokerResponse[]> {
    return this.request<BrokerResponse[]>('/api/v1/transactions/brokers');
  }

  /**
   * 새 거래 생성
   * @param transactionData 거래 생성 데이터
   * @returns 생성된 거래 정보
   */
  static async createTransaction(
    transactionData: TransactionCreateRequest
  ): Promise<TransactionResponse> {
    return this.request<TransactionResponse>(
      '/api/v1/transactions/create-transaction',
      {
        method: 'POST',
        body: JSON.stringify(transactionData),
      }
    );
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
      `/api/v1/transactions/commission-rate?${searchParams.toString()}`
    );
  }

  /**
   * 포트폴리오 요약 조회
   * @returns 포트폴리오 요약 정보
   */
  static async getPortfolioSummary(): Promise<PortfolioSummaryResponse> {
    return this.request<PortfolioSummaryResponse>('/api/v1/transactions/');
  }
}
