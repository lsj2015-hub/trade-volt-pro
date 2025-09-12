import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { VolatilityStock, PatternPeriod } from '@/types/types';

// 로컬 차트 데이터 타입 (originalDate 포함)
export interface LocalChartData {
  date: string; // YY/MM/DD 형식으로 표시될 날짜
  originalDate: string; // YYYYMMDD 형식의 원본 날짜 (정렬용)
  price: number;
  volume: number;
}

interface StockChartSectionProps {
  selectedStock: VolatilityStock | null;
  chartData: LocalChartData[];
  isLoading: boolean;
}

export const StockChartSection = ({
  selectedStock,
  chartData,
  isLoading,
}: StockChartSectionProps) => {
  // 선택된 종목이 없으면 아무것도 표시하지 않음
  if (!selectedStock) {
    return null;
  }

  // 날짜 파싱 헬퍼 함수들
  const parseYYMMDD = (yymmdd: string): Date => {
    if (yymmdd.length !== 8) return new Date();
    const year = 2000 + parseInt(yymmdd.substring(0, 2));
    const month = parseInt(yymmdd.substring(2, 4)) - 1;
    const day = parseInt(yymmdd.substring(4, 6));
    return new Date(year, month, day);
  };

  const parseYYYYMMDD = (yyyymmdd: string): Date => {
    if (yyyymmdd.length !== 8) return new Date();
    const year = parseInt(yyyymmdd.substring(0, 4));
    const month = parseInt(yyyymmdd.substring(4, 6)) - 1;
    const day = parseInt(yyyymmdd.substring(6, 8));
    return new Date(year, month, day);
  };

  // 패턴 구간인지 확인하는 함수
  const isInPatternPeriod = (chartDate: string): boolean => {
    if (!selectedStock.patternPeriods) return false;

    try {
      const chartDateObj = parseYYMMDD(chartDate.replace(/\//g, '')); // YY/MM/DD → YYMMDD → Date

      return selectedStock.patternPeriods.some((pattern: PatternPeriod) => {
        const startDate = parseYYYYMMDD(pattern.startDate);
        const endDate = parseYYYYMMDD(pattern.endDate);
        return chartDateObj >= startDate && chartDateObj <= endDate;
      });
    } catch (error) {
      console.error('날짜 변환 오류:', error);
      return false;
    }
  };

  // 차트 데이터를 원본 날짜 기준으로 정렬
  const sortedChartData = [...chartData].sort(
    (a, b) => a.originalDate?.localeCompare(b.originalDate || '') || 0
  );

  // 패턴 정보 요약 생성
  const formatPatternSummary = (pattern: PatternPeriod): string => {
    const startDate = parseYYYYMMDD(pattern.startDate);
    const endDate = parseYYYYMMDD(pattern.endDate);

    const formatDate = (date: Date) => {
      const year = date.getFullYear().toString().substring(2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };

    return `${formatDate(startDate)}~${formatDate(endDate)}`;
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isPattern = isInPatternPeriod(data.date);
    const price = payload[0].value;

    return (
      <div className="relative">
        {/* 컴팩트한 툴팁 컨테이너 */}
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-lg p-3 shadow-xl ring-1 ring-black/5 min-w-40">
          {/* 헤더 - 날짜 (작게) */}
          <div className="flex items-center justify-center mb-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-800">{label}</span>
            </div>
          </div>

          {/* 주가 (컴팩트) */}
          <div className="text-center mb-2">
            <div className="text-xs text-blue-600 font-medium mb-1">주가</div>
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {price.toLocaleString()}원
            </div>
          </div>

          {/* 거래량 (한 줄) */}
          <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50/80 rounded-md mb-2">
            <span className="text-xs text-gray-600">거래량</span>
            <span className="text-xs font-semibold text-gray-800">
              {data.volume.toLocaleString()}
            </span>
          </div>

          {/* 패턴 구간 (미니 버전) */}
          {isPattern && (
            <div className="relative p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white">
                  변동성 패턴
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 작은 화살표 */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-white/95 border border-gray-200/60 rotate-45"></div>
        </div>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="mt-6 p-6 border rounded-lg bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-blue-500" />
          <h4 className="font-semibold">차트 로딩 중...</h4>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // 차트 데이터가 없는 경우
  if (!sortedChartData || sortedChartData.length === 0) {
    return (
      <div className="mt-6 p-6 border rounded-lg bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-blue-500" />
          <h4 className="font-semibold">
            {selectedStock.stockName} ({selectedStock.stockCode})
          </h4>
        </div>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          차트 데이터를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-xl text-gray-900">
              {selectedStock.stockName}
            </h4>
            <p className="text-sm text-gray-600 font-mono">
              {selectedStock.stockCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 rounded"></div>
            <span className="text-gray-600 font-medium">주가 추이</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-red-500 opacity-20 border-2 border-red-500 border-dashed rounded"></div>
            <span className="text-gray-600 font-medium">변동성 패턴</span>
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
            {sortedChartData.length}일 분석
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-96 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sortedChartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval="preserveStartEnd"
              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickFormatter={(value) => `${Math.round(value / 1000)}K`}
              domain={['dataMin - 500', 'dataMax + 500']}
              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 패턴 구간을 빨간색 블럭으로 표시 - 더 명확하게 */}
            {selectedStock?.patternPeriods?.map((pattern, index) => {
              // YYYYMMDD를 YY/MM/DD로 변환
              const convertDate = (yyyymmdd: string): string => {
                if (!yyyymmdd || yyyymmdd.length !== 8) return '';
                const year = yyyymmdd.substring(2, 4);
                const month = yyyymmdd.substring(4, 6);
                const day = yyyymmdd.substring(6, 8);
                return `${year}/${month}/${day}`;
              };

              const startDateFormatted = convertDate(pattern.startDate);
              const endDateFormatted = convertDate(pattern.endDate);

              return (
                <ReferenceArea
                  key={`pattern-area-${index}`}
                  x1={startDateFormatted}
                  x2={endDateFormatted}
                  fill="#ef4444"
                  fillOpacity={0.25}
                  stroke="#dc2626"
                  strokeOpacity={0.6}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              );
            })}

            {/* 메인 주가 라인 */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={1}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#f36f0b',
                strokeWidth: 1,
                stroke: '#ffffff',
                style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' },
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 패턴 정보 상세 */}
      {selectedStock.patternPeriods &&
        selectedStock.patternPeriods.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
            <h5 className="font-bold mb-4 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg">발견된 패턴 정보</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                {selectedStock.patternPeriods.length}개
              </span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedStock.patternPeriods
                .slice(0, 6)
                .map((pattern, index) => (
                  <div
                    key={index}
                    className="group p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          패턴 #{index + 1}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        {formatPatternSummary(pattern)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-red-600 font-bold text-lg flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {pattern.declineRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          하락
                        </div>
                      </div>

                      <div className="flex-1 flex justify-center">
                        <div className="text-2xl text-muted-foreground">→</div>
                      </div>

                      <div className="text-center">
                        <div className="text-green-600 font-bold text-lg flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />+
                          {pattern.recoveryRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          반등
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {selectedStock.patternPeriods.length > 6 && (
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-2xl font-bold">
                      +{selectedStock.patternPeriods.length - 6}
                    </div>
                    <div className="text-xs">추가 패턴</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
