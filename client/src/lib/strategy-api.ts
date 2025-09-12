import {
  StockChartRequest,
  StockChartResponse,
  VolatilityAnalysisRequest,
  VolatilityAnalysisResponse,
} from '@/types/types';
import { StrategyType } from '@/types/enum';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class StrategyAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string,
    public strategyType?: StrategyType
  ) {
    super(message);
    this.name = 'StrategyAPIError';
  }
}

export class StrategyAPI {
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

        throw new StrategyAPIError(
          errorData.detail ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.error_code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof StrategyAPIError) {
        throw error;
      }

      throw new StrategyAPIError(
        `네트워크 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }

  // ==========================================
  // 🎯 변동성 분석 (Volatility Analysis)
  // ==========================================

  static async runVolatilityAnalysis(
    request: VolatilityAnalysisRequest
  ): Promise<VolatilityAnalysisResponse> {
    try {
      const result = await this.request<VolatilityAnalysisResponse>(
        '/api/v1/strategy/volatility-analysis',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return result;
    } catch (error) {
      if (error instanceof StrategyAPIError) {
        throw error;
      }
      throw new StrategyAPIError(
        `변동성 분석 실행 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }

  static async getStockChartData(
    request: StockChartRequest
  ): Promise<StockChartResponse> {
    try {
      const result = await this.request<StockChartResponse>(
        '/api/v1/strategy/stock-chart-data',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return result;
    } catch (error) {
      if (error instanceof StrategyAPIError) {
        throw error;
      }
      throw new StrategyAPIError(
        `차트 데이터 조회 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }
}
