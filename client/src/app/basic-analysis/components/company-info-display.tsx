'use client';

import {
  AnalysisData,
  CompanySummary,
  FinancialSummary,
  InvestmentIndex,
  MarketInfo,
  AnalystOpinion,
  MajorExecutors,
} from '@/types/types';
import { AnalysisInfo, AnalysisInfoType } from '@/types/enum';

interface CompanyInfoDisplayProps {
  infoType: AnalysisInfoType;
  data: AnalysisData;
}

export const CompanyInfoDisplay = ({
  infoType,
  data,
}: CompanyInfoDisplayProps) => {
  // 정보 유형별 렌더링
  switch (infoType) {
    case AnalysisInfo.COMPANY_SUMMARY:
      const companyData = data as CompanySummary;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">회사명</h4>
              <p className="text-sm">{companyData.long_name || ''}</p>
            </div>
            <div>
              <h4 className="font-medium">업종</h4>
              <p className="text-sm">
                {companyData.sector || ''} / {companyData.industry || ''}
              </p>
            </div>
            <div>
              <h4 className="font-medium">소재지</h4>
              <p className="text-sm">
                {companyData.city || ''}, {companyData.country || ''}
              </p>
            </div>
            <div>
              <h4 className="font-medium">직원 수</h4>
              <p className="text-sm">{companyData.full_time_employees || ''}</p>
            </div>
          </div>
          {companyData.website && (
            <div>
              <h4 className="font-medium">웹사이트</h4>
              <a
                href={companyData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                {companyData.website}
              </a>
            </div>
          )}
          <div>
            <h4 className="font-medium">사업 개요</h4>
            <p className="text-sm whitespace-pre-wrap">
              {companyData.long_business_summary || '정보 없음'}
            </p>
          </div>
        </div>
      );

    case AnalysisInfo.FINANCIAL_SUMMARY:
      const financialData = data as FinancialSummary;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">총 매출</h4>
            <p className="text-sm">{financialData.total_revenue || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">순이익</h4>
            <p className="text-sm">
              {financialData.net_income_to_common || ''}
            </p>
          </div>
          <div>
            <h4 className="font-medium">영업이익률</h4>
            <p className="text-sm">{financialData.operating_margins || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">배당수익률</h4>
            <p className="text-sm">{financialData.dividend_yield || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">EPS</h4>
            <p className="text-sm">{financialData.trailing_eps || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">총 현금</h4>
            <p className="text-sm">{financialData.total_cash || ''}</p>
          </div>
        </div>
      );

    case AnalysisInfo.INVESTMENT_INDEX:
      const indexData = data as InvestmentIndex;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">PER</h4>
            <p className="text-sm">{indexData.trailing_pe || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">PBR</h4>
            <p className="text-sm">{indexData.price_to_book || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">ROE</h4>
            <p className="text-sm">{indexData.return_on_equity || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">ROA</h4>
            <p className="text-sm">{indexData.return_on_assets || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">베타</h4>
            <p className="text-sm">{indexData.beta || ''}</p>
          </div>
        </div>
      );

    case AnalysisInfo.MARKET_INFO:
      const marketData = data as MarketInfo;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">현재가</h4>
            <p className="text-sm font-bold">
              {marketData.current_price || ''}
            </p>
          </div>
          <div>
            <h4 className="font-medium">전일종가</h4>
            <p className="text-sm">{marketData.previous_close || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">시가총액</h4>
            <p className="text-sm">{marketData.market_cap || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">거래량</h4>
            <p className="text-sm">{marketData.volume || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">52주 최고가</h4>
            <p className="text-sm">{marketData.fifty_two_week_high || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">52주 최저가</h4>
            <p className="text-sm">{marketData.fifty_two_week_low || ''}</p>
          </div>
        </div>
      );

    case AnalysisInfo.ANALYST_OPINION:
      const analystData = data as AnalystOpinion;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">추천 등급</h4>
            <p className="text-sm">{analystData.recommendation_key || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-medium">분석가 수</h4>
            <p className="text-sm">
              {analystData.number_of_analyst_opinions || 0}명
            </p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (평균)</h4>
            <p className="text-sm">{analystData.target_mean_price || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (최고)</h4>
            <p className="text-sm">{analystData.target_high_price || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (최저)</h4>
            <p className="text-sm">{analystData.target_low_price || ''}</p>
          </div>
        </div>
      );

    case AnalysisInfo.MAJOR_EXECUTORS:
      const executorData = data as MajorExecutors;

      if (
        !executorData.officers ||
        !Array.isArray(executorData.officers) ||
        executorData.officers.length === 0
      ) {
        return (
          <div className="text-center py-4 text-muted-foreground">
            임원진 정보가 없습니다.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {executorData.officers.map((officer, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{officer.name || ''}</h4>
                  <p className="text-sm text-muted-foreground">
                    {officer.title || ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {officer.total_pay || ''}
                  </p>
                  {officer.age && (
                    <p className="text-xs text-muted-foreground">
                      나이: {officer.age}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return <p className="text-center">지원하지 않는 정보 유형입니다.</p>;
  }
};
