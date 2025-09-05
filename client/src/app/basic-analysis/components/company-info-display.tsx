'use client';

import {
  AnalysisInfoType,
  AnalysisData,
  CompanySummary,
  FinancialSummary,
  InvestmentIndex,
  MarketInfo,
  AnalystOpinion,
  MajorExecutors,
} from '@/types/types';

interface CompanyInfoDisplayProps {
  infoType: AnalysisInfoType;
  data: AnalysisData;
}

export const CompanyInfoDisplay = ({ infoType, data }: CompanyInfoDisplayProps) => {
  // 정보 유형별 렌더링
  switch (infoType) {
    case 'company-summary':
      const companyData = data as CompanySummary;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">회사명</h4>
              <p className="text-sm">{companyData.longName || ''}</p>
            </div>
            <div>
              <h4 className="font-medium">업종</h4>
              <p className="text-sm">
                {companyData.sector || ''} /{' '}
                {companyData.industry || ''}
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
              <p className="text-sm">
                {companyData.fullTimeEmployees || ''}
              </p>
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
              {companyData.longBusinessSummary || '정보 없음'}
            </p>
          </div>
        </div>
      );

    case 'financial-summary':
      const financialData = data as FinancialSummary;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">총 매출</h4>
            <p className="text-sm">{financialData.totalRevenue || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">순이익</h4>
            <p className="text-sm">
              {financialData.netIncomeToCommon || ''}
            </p>
          </div>
          <div>
            <h4 className="font-medium">영업이익률</h4>
            <p className="text-sm">
              {financialData.operatingMargins || ''}
            </p>
          </div>
          <div>
            <h4 className="font-medium">배당수익률</h4>
            <p className="text-sm">{financialData.dividendYield || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">EPS</h4>
            <p className="text-sm">{financialData.trailingEps || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">총 현금</h4>
            <p className="text-sm">{financialData.totalCash || ''}</p>
          </div>
        </div>
      );

    case 'investment-index':
      const indexData = data as InvestmentIndex;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">PER</h4>
            <p className="text-sm">{indexData.trailingPE || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">PBR</h4>
            <p className="text-sm">{indexData.priceToBook || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">ROE</h4>
            <p className="text-sm">{indexData.returnOnEquity || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">ROA</h4>
            <p className="text-sm">{indexData.returnOnAssets || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">베타</h4>
            <p className="text-sm">{indexData.beta || ''}</p>
          </div>
        </div>
      );

    case 'market-info':
      const marketData = data as MarketInfo;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">현재가</h4>
            <p className="text-sm font-bold">
              {marketData.currentPrice || ''}
            </p>
          </div>
          <div>
            <h4 className="font-medium">전일종가</h4>
            <p className="text-sm">{marketData.previousClose || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">시가총액</h4>
            <p className="text-sm">{marketData.marketCap || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">거래량</h4>
            <p className="text-sm">{marketData.volume || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">52주 최고가</h4>
            <p className="text-sm">{marketData.fiftyTwoWeekHigh || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">52주 최저가</h4>
            <p className="text-sm">{marketData.fiftyTwoWeekLow || ''}</p>
          </div>
        </div>
      );

    case 'analyst-opinion':
      const analystData = data as AnalystOpinion;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">추천 등급</h4>
            <p className="text-sm">
              {analystData.recommendationKey || 'N/A'}
            </p>
          </div>
          <div>
            <h4 className="font-medium">분석가 수</h4>
            <p className="text-sm">
              {analystData.numberOfAnalystOpinions || 0}명
            </p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (평균)</h4>
            <p className="text-sm">{analystData.targetMeanPrice || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (최고)</h4>
            <p className="text-sm">{analystData.targetHighPrice || ''}</p>
          </div>
          <div>
            <h4 className="font-medium">목표가 (최저)</h4>
            <p className="text-sm">{analystData.targetLowPrice || ''}</p>
          </div>
        </div>
      );

    case 'major-executors':
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
                    {officer.totalPay || ''}
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
