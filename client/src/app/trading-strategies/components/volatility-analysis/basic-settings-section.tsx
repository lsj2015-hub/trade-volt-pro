import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar } from 'lucide-react';

// 국가별 시장 매핑
export const COUNTRY_MARKETS: Record<string, { value: string; label: string }[]> = {
  korea: [
    { value: 'kospi', label: 'KOSPI' },
    { value: 'kosdaq', label: 'KOSDAQ' },
  ],
  usa: [
    { value: 'nyse', label: 'NYSE' },
    { value: 'nasdaq', label: 'NASDAQ' },
  ],
  japan: [{ value: 'tse', label: 'TSE (도쿄)' }],
};

interface BasicSettingsSectionProps {
  country: string;
  setCountry: (value: string) => void;
  market: string;
  setMarket: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export const BasicSettingsSection = ({
  country,
  setCountry,
  market,
  setMarket,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: BasicSettingsSectionProps) => {
  // 국가 변경시 시장 초기화
  useEffect(() => {
    if (country) {
      setMarket('');
    }
  }, [country, setMarket]);

  const availableMarkets = COUNTRY_MARKETS[country] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold text-primary">기본 설정</label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-6">
        <div className="space-y-2">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="[&>span]:w-full [&>span]:text-center">
              <SelectValue placeholder="국가 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="korea">한국</SelectItem>
              <SelectItem value="usa">미국</SelectItem>
              <SelectItem value="japan">일본</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Select value={market} onValueChange={setMarket} disabled={!country}>
            <SelectTrigger className="[&>span]:w-full [&>span]:text-center">
              <SelectValue
                placeholder={country ? '시장 선택' : '먼저 국가를 선택하세요'}
              />
            </SelectTrigger>
            <SelectContent>
              {availableMarkets.map((marketOption) => (
                <SelectItem key={marketOption.value} value={marketOption.value}>
                  {marketOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="시작일"
            defaultCalendarDate="week-ago"
            className="text-center"
          />
        </div>

        <div className="space-y-2">
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="종료일"
            defaultCalendarDate="today"
            className="text-center"
          />
        </div>
      </div>
    </div>
  );
}
