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
import { COUNTRY_DISPLAY_NAMES, getMarketsByCountry } from '@/types/enum';

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

  const availableMarkets = getMarketsByCountry(country);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold text-primary">기본 설정</label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-6">
        {/* 국가 선택 */}
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="국가 선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COUNTRY_DISPLAY_NAMES).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 거래소 선택 */}
        <Select value={market} onValueChange={setMarket} disabled={!country}>
          <SelectTrigger>
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

        {/* 시작일 선택 */}
        <DatePicker
          date={startDate}
          onSelect={setStartDate}
          placeholder="시작일"
          defaultCalendarDate="week-ago"
        />

        {/* 종료일 선택 */}
        <DatePicker
          date={endDate}
          onSelect={setEndDate}
          placeholder="종료일"
          defaultCalendarDate="today"
        />
      </div>
    </div>
  );
};
