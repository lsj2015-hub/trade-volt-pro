import {
  AnalysisInfoType,
  CompanySummary,
  FinancialSummary,
  InvestmentIndex,
  MarketInfo,
  AnalystOpinion,
  MajorExecutors,
  AnalysisAPIError,
  AnalysisResponse,
  AnalysisParams,
} from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class AnalysisAPI {
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
        const errorData = await response.json().catch(() => null);
        throw new AnalysisAPIError(
          errorData?.detail ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.error_code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof AnalysisAPIError) {
        throw error;
      }
      throw new AnalysisAPIError(`분석 API 요청 실패: ${error}`);
    }
  }

  // 통합 분석 정보 조회
  static async getAnalysis({
    symbol,
    infoType,
    countryCode = 'US',
    companyName = '',
    exchangeCode,
  }: AnalysisParams): Promise<AnalysisResponse> {
    const params = new URLSearchParams({
      info_type: infoType,
      country_code: countryCode,
      company_name: companyName,
    });

    // exchangeCode가 있을 때만 추가
    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    return this.request<AnalysisResponse>(
      `/api/v1/analysis/${symbol}?${params}`
    );
  }

  // 개별 분석 정보 조회 메서드들
  static async getCompanySummary(
    symbol: string,
    countryCode: string = 'US',
    companyName: string = '',
    exchangeCode?: string
  ): Promise<CompanySummary> {
    const params = new URLSearchParams({
      country_code: countryCode,
      company_name: companyName,
    });

    // exchangeCode가 있을 때만 추가
    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    return this.request<CompanySummary>(
      `/api/v1/analysis/${symbol}/company-summary?${params}`
    );
  }

  static async getFinancialSummary(symbol: string): Promise<FinancialSummary> {
    return this.request<FinancialSummary>(
      `/api/v1/analysis/${symbol}/financial-summary`
    );
  }

  static async getInvestmentIndex(symbol: string): Promise<InvestmentIndex> {
    return this.request<InvestmentIndex>(
      `/api/v1/analysis/${symbol}/investment-index`
    );
  }

  static async getMarketInfo(symbol: string): Promise<MarketInfo> {
    return this.request<MarketInfo>(`/api/v1/analysis/${symbol}/market-info`);
  }

  static async getAnalystOpinion(symbol: string): Promise<AnalystOpinion> {
    return this.request<AnalystOpinion>(
      `/api/v1/analysis/${symbol}/analyst-opinion`
    );
  }

  static async getMajorExecutors(
    symbol: string,
    exchangeCode?: string,
    countryCode: string = 'US'
  ): Promise<MajorExecutors> {
    const params = new URLSearchParams();
    
    // exchangeCode가 있을 때만 추가
    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    // countryCode 추가
    params.append('country_code', countryCode);

    const queryString = params.toString();
    const endpoint = `/api/v1/analysis/${symbol}/major-executors?${queryString}`;

    return this.request<MajorExecutors>(endpoint);
  }
}
