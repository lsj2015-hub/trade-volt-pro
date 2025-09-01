import {
  CompletePortfolioResponse,
  RealizedProfitData,
  StockLotResponse,
} from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class PortfolioAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'PortfolioAPIError';
  }
}

export class PortfolioAPI {
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

        throw new PortfolioAPIError(
          errorData.detail ||
            errorData.error?.message ||
            `HTTP ${response.status}`,
          response.status,
          errorData.error?.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof PortfolioAPIError) {
        throw error;
      }

      // 네트워크 오류 등
      throw new PortfolioAPIError(
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * 완전한 포트폴리오 조회 (메인 대시보드용)
   * - 전체 증권사 통합 포트폴리오 현황
   * - 실시간 현재가 + 손익 계산
   * - 국내/해외 요약 카드
   * - 환율 정보
   * @returns 완전한 포트폴리오 정보
   */
  static async getCompletePortfolio(): Promise<CompletePortfolioResponse> {
    return this.request<CompletePortfolioResponse>('/api/v1/portfolio/');
  }

  /**
   * 포트폴리오 개요/통계
   * - 총 보유종목 수, 사용 브로커 수, 총 투자금액, 총 실현손익 등
   * @returns 포트폴리오 개요 정보
   */
  static async getPortfolioOverview(): Promise<any> {
    return this.request<any>('/api/v1/portfolio/overview');
  }

  /**
   * 종목별 포트폴리오 요약 (모든 브로커 합산)
   * - 각 종목별 총 보유량, 전체 평균단가, 투자금액, 실현손익 등
   * @returns 종목별 포트폴리오 데이터
   */
  static async getPortfolioStocks(): Promise<any> {
    return this.request<any>('/api/v1/portfolio/stocks');
  }

  /**
   * 특정 종목의 브로커별 상세 보유현황
   * - 브로커별 보유량, 평균단가, 손익
   * - 실시간 현재가 + 평가금액
   * - 실현/미실현 손익
   * @param stockSymbol 종목 심볼
   * @returns 브로커별 상세 보유현황
   */
  static async getStockDetailByBrokers(
    stockSymbol: string
  ): Promise<StockLotResponse[]> {
    const response = await this.request<{
      success: boolean;
      data: StockLotResponse[];
      total_count: number;
    }>(`/api/v1/portfolio/stocks/${stockSymbol}/detail`);
    return response.data;
  }

  /**
   * 실현손익 내역 조회
   * - 매도 거래별 실현손익 상세 내역
   * - 필터링: 시장구분, 증권사, 종목, 기간
   * @param filters 필터 조건
   * @returns 실현손익 내역 데이터
   */
  static async getRealizedProfits(): Promise<{
    success: boolean;
    data: {
      transactions: RealizedProfitData[];
      metadata: {
        exchangeRateToday: number;
        availableStocks: Array<{
          symbol: string;
          companyName: string;
          companyNameEn: string;
        }>;
        availableBrokers: Array<{
          id: number;
          name: string;
          displayName: string;
        }>;
      };
    };
  }> {
    // 필터 없이 모든 데이터를 가져옴 (클라이언트 필터링용)
    return this.request<{
      success: boolean;
      data: {
        transactions: RealizedProfitData[];
        metadata: {
          exchangeRateToday: number;
          availableStocks: Array<{
            symbol: string;
            companyName: string;
            companyNameEn: string;
          }>;
          availableBrokers: Array<{
            id: number;
            name: string;
            displayName: string;
          }>;
        };
      };
    }>('/api/v1/portfolio/realized-profits');
  }
}
