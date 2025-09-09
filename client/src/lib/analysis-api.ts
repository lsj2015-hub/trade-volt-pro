import {
  CompanySummary,
  FinancialSummary,
  InvestmentIndex,
  MarketInfo,
  AnalystOpinion,
  MajorExecutors,
  AnalysisAPIError,
  AnalysisResponse,
  AnalysisParams,
  PriceHistoryResponse,
  NewsResponse,
  NewsTranslateResponse,
  NewsTranslateRequest,
  ChatMessage,
  LLMQuestionRequest,
  LLMQuestionResponse,
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
    info_type,
    country_code = 'US',
    company_name = '',
    exchange_code,
  }: AnalysisParams): Promise<AnalysisResponse> {
    const params = new URLSearchParams({
      info_type: info_type,
      country_code: country_code,
      company_name: company_name,
    });

    // exchangeCode가 있을 때만 추가
    if (exchange_code) {
      params.append('exchange_code', exchange_code);
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

  // 재무제표 상세 조회
  static async getFinancialStatements(
    symbol: string,
    statementType: 'income' | 'balance' | 'cashflow',
    exchangeCode?: string
  ): Promise<{
    success: boolean;
    data: {
      years: string[];
      data: Array<{ item: string; [year: string]: string }>;
    };
  }> {
    const params = new URLSearchParams();

    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/analysis/${symbol}/financial-statements/${statementType}${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{
      success: boolean;
      data: {
        years: string[];
        data: Array<{ item: string; [year: string]: string }>;
      };
    }>(endpoint);
  }

  // 주가 히스토리 조회
  static async getPriceHistory(
    symbol: string,
    startDate: string,
    endDate: string,
    exchangeCode?: string
  ): Promise<PriceHistoryResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/analysis/${symbol}/price-history?${queryString}`;

    return this.request<PriceHistoryResponse>(endpoint);
  }

  // 뉴스 조회
  static async getStockNews(
    symbol: string,
    startDate: string,
    endDate: string,
    exchangeCode?: string,
    limit: number = 50
  ): Promise<NewsResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      limit: limit.toString(),
    });

    if (exchangeCode) {
      params.append('exchange_code', exchangeCode);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/analysis/${symbol}/news?${queryString}`;

    return this.request<NewsResponse>(endpoint);
  }

  // 뉴스 번역 (제목 + 요약 동시)
  static async translateNews(
    title: string,
    summary: string,
    targetLang: string = 'ko'
  ): Promise<NewsTranslateResponse> {
    const endpoint = `/api/v1/analysis/translate-news`;

    const requestData: NewsTranslateRequest = {
      original: {
        title,
        summary,
      },
      target_lang: targetLang,
    };

    return this.request<NewsTranslateResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // David AI 질문
  static async askDavidQuestion(
    symbol: string,
    question: string,
    conversationHistory: ChatMessage[] = [],
    companyData: string = '',
    financialData: string = '',
    priceHistoryData: string = '',
    newsData: string = ''
  ): Promise<LLMQuestionResponse> {
    const endpoint = `/api/v1/analysis/${symbol}/ask-david`;

    const requestData: LLMQuestionRequest = {
      question,
      conversation_history: conversationHistory,
      company_data: companyData,
      financial_data: financialData,
      price_history_data: priceHistoryData,
      news_data: newsData,
      include_company_summary: !!companyData,
      include_financial_summary: !!financialData,
      include_market_info: false,
      include_price_history: !!priceHistoryData,
      include_news_data: !!newsData,
    };

    return this.request<LLMQuestionResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }
}
