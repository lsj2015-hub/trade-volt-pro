'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line,
  BarChart,
} from 'recharts';
import {
  StockInfo,
  PriceHistoryResponse,
  AnalysisAPIError,
} from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';
import { getDefaultDates } from '@/lib/utils';

interface PriceHistorySectionProps {
  selectedStock: StockInfo | null;
  onDataUpdate?: (data: PriceHistoryResponse | null, show: boolean) => void;
}

export const PriceHistorySection = ({
  selectedStock,
  onDataUpdate,
}: PriceHistorySectionProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    getDefaultDates().sevenDaysAgo
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    getDefaultDates().today
  );
  const [priceHistoryData, setPriceHistoryData] =
    useState<PriceHistoryResponse | null>(null);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState<string>('');
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // 주가 히스토리 조회 함수
  const handlePriceHistorySearch = async () => {
    // 이미 데이터가 있고 표시 중이면 숨기기
    if (showPriceHistory && priceHistoryData) {
      setShowPriceHistory(false);
      onDataUpdate?.(priceHistoryData, false);
      return;
    }

    if (!selectedStock || !startDate || !endDate) {
      setPriceHistoryError('종목과 날짜를 모두 선택해주세요.');
      return;
    }

    setPriceHistoryLoading(true);
    setPriceHistoryError('');
    setPriceHistoryData(null);

    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const result = await AnalysisAPI.getPriceHistory(
        selectedStock.symbol.toUpperCase(),
        startDateStr,
        endDateStr,
        selectedStock.exchange_code
      );

      if (result.success && result.data && result.data.length > 0) {
        setPriceHistoryData(result);
        setShowPriceHistory(true);
        onDataUpdate?.(result, true);
      } else {
        setPriceHistoryError('해당 기간의 주가 데이터를 찾을 수 없습니다.');
        onDataUpdate?.(null, false);
      }
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setPriceHistoryError(err.message);
      } else {
        setPriceHistoryError('주가 데이터 조회 중 오류가 발생했습니다.');
      }
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  // 주가 히스토리 Skeleton UI
  const renderPriceHistorySkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex justify-between items-center p-2 border-b">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  // 주가 히스토리 렌더링
  const renderPriceHistory = () => {
    if (priceHistoryLoading) {
      return renderPriceHistorySkeleton();
    }

    if (priceHistoryError) {
      return (
        <div className="text-red-500 text-center py-4">{priceHistoryError}</div>
      );
    }

    if (
      !priceHistoryData ||
      !priceHistoryData.data ||
      priceHistoryData.data.length === 0
    ) {
      return (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-muted-foreground text-sm">
            조회 기간을 선택하고 '주가 데이터 조회' 버튼을 클릭하여 히스토리를
            확인하세요.
          </p>
        </div>
      );
    }

    // 캔들차트용 데이터 변환
    const chartData = priceHistoryData.data.map((item) => ({
      ...item,
      date: item.date,
      // 캔들스틱을 위한 데이터 (High-Low를 막대로, Open-Close를 다른 색상으로)
      highLow: [item.low, item.high],
      openClose: [
        Math.min(item.open, item.close),
        Math.max(item.open, item.close),
      ],
      isGreen: item.close >= item.open, // 상승/하락 구분
    }));

    return (
      <div className="space-y-4">
        {/* 데이터 요약 정보 */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
          {priceHistoryData.symbol} • 조회기간: {priceHistoryData.start_date} ~{' '}
          {priceHistoryData.end_date} • 데이터 {priceHistoryData.data_count}건
        </div>

        {/* 주가 차트 */}
        <div className="border rounded-lg p-2 bg-white">
          {/* 선형 캔들 차트 */}
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={false}
                height={0}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 11 }}
                width={55}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                label={{
                  angle: -90,
                  position: 'outside',
                  offset: -40,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isUp = data.close >= data.open;
                    const changeAmount = data.close - data.open;
                    const changePercent = (changeAmount / data.open) * 100;

                    return (
                      <div className="bg-white p-2 border rounded shadow-md text-xs">
                        <p className="font-medium mb-1 text-xs">{label}</p>
                        <div className="space-y-0.5">
                          <p>
                            시가:{' '}
                            <span
                              style={{ color: isUp ? '#10b981' : '#ef4444' }}
                            >
                              ${data.open.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            고가:{' '}
                            <span className="text-blue-600">
                              ${data.high.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            저가:{' '}
                            <span className="text-orange-600">
                              ${data.low.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            종가:{' '}
                            <span
                              style={{
                                color: isUp ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                              }}
                            >
                              ${data.close.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            등락:{' '}
                            <span
                              style={{ color: isUp ? '#10b981' : '#ef4444' }}
                            >
                              {isUp ? '▲' : '▼'} $
                              {Math.abs(changeAmount).toFixed(2)} (
                              {changePercent > 0 ? '+' : ''}
                              {changePercent.toFixed(2)}%)
                            </span>
                          </p>
                          <div className="border-b-2 pb-1" />
                          <p className="pt-1">
                            거래량:{' '}
                            <span className="text-gray-600">
                              {data.volume.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* 고가-저가 라인 */}
              <Line
                type="monotone"
                dataKey="high"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#f59e0b"
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />

              {/* 종가 라인 (메인) */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 거래량 차트 */}
          <div className="mt-0">
            <ResponsiveContainer width="100%" height={130}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  stroke="#6b7280"
                  interval={
                    chartData.length > 20
                      ? Math.floor(chartData.length / 5) - 1
                      : 0
                  }
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={55}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  label={{
                    angle: -90,
                    position: 'outside',
                    offset: -40,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill="#8884d8"
                  stroke="#7c3aed"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 주가 데이터 테이블 */}
        <div className="overflow-x-auto">
          <div className="max-h-80 overflow-y-auto border rounded">
            <table className="w-full px-3">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    날짜
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    종가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    시가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    고가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    저가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    거래량
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceHistoryData.data.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="text-center px-3 py-1.5 font-medium text-xs">
                      {row.date}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs font-bold">
                      {row.close.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.open.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.high.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.low.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.volume.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          주가 히스토리
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedStock ? (
          <div className="text-center py-2">
            <div className="text-4xl mb-4">📈</div>
            <p className="text-gray-500">
              먼저 상단에서 종목을 검색하여 선택해주세요
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 날짜 선택 및 조회 버튼 */}
            <div className="flex flex-wrap gap-8 items-end justify-between">
              <div className="flex gap-8 items-end">
                <div className="w-48">
                  <label className="text-sm font-medium mb-1 block">
                    시작일
                  </label>
                  <DatePicker
                    date={startDate}
                    onSelect={setStartDate}
                    className="text-center justify-center"
                  />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-1 block">
                    종료일
                  </label>
                  <DatePicker
                    date={endDate}
                    onSelect={setEndDate}
                    className="text-center justify-center"
                  />
                </div>
              </div>
              <Button
                onClick={handlePriceHistorySearch}
                disabled={priceHistoryLoading || !startDate || !endDate}
                variant="basic"
                className="w-[150px]"
              >
                {priceHistoryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {showPriceHistory ? '데이터 숨기기' : '주가 데이터 조회'}
              </Button>
            </div>

            {/* 주가 데이터 표시 */}
            {showPriceHistory && renderPriceHistory()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

