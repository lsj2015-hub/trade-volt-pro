import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { VolatilityStock } from './volatility-results-section';


// 차트 데이터 타입
export interface ChartData {
  date: string;
  price: number;
  volume: number;
}

interface StockChartSectionProps {
  selectedStock: VolatilityStock | null;
  chartData: ChartData[];
}

export const StockChartSection = ({
  selectedStock,
  chartData,
}: StockChartSectionProps) => {
  if (!selectedStock) {
    return null;
  }

  return (
    <div className="mt-6 p-4 border rounded-lg bg-background">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <h4 className="font-semibold">
          {selectedStock.stockName} ({selectedStock.stockCode}) 주가 차트
        </h4>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()}원`,
                '주가',
              ]}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
