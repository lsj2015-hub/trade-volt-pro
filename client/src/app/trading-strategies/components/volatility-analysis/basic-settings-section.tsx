import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar } from 'lucide-react';
import {
  COUNTRY_DISPLAY_NAMES,
  getMarketsByCountry,
  getFilterDefaultsByCountry,
  getCurrencySymbolByCountry,
} from '@/types/enum';

interface BasicSettingsSectionProps {
  country: string;
  setCountry: (value: string) => void;
  market: string;
  setMarket: (value: string) => void;
  marketCap: string;
  setMarketCap: (value: string) => void;
  tradingVolume: string;
  setTradingVolume: (value: string) => void;
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
  marketCap,
  setMarketCap,
  tradingVolume,
  setTradingVolume,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: BasicSettingsSectionProps) => {
  // 국가 변경시 시장 초기화 및 필터 기본값 설정
  useEffect(() => {
    if (country) {
      setMarket('');
      const defaults = getFilterDefaultsByCountry(country);
      setMarketCap(defaults.marketCap.toString());
      setTradingVolume(defaults.tradingVolume.toString());
    }
  }, [country, setMarket, setMarketCap, setTradingVolume]);

  const availableMarkets = getMarketsByCountry(country);
  const currencySymbol = getCurrencySymbolByCountry(country);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold text-primary">기본 설정</label>
      </div>

      <div className="space-y-4 pl-6">
        {/* 첫 번째 행: 국가, 거래소, 시총 (데스크탑 3열, 태블릿 3열, 모바일 2열) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 국가 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">국가</label>
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
          </div>

          {/* 거래소 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">거래소</label>
            <Select
              value={market}
              onValueChange={setMarket}
              disabled={!country}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={country ? '시장 선택' : '먼저 국가를 선택하세요'}
                />
              </SelectTrigger>
              <SelectContent>
                {availableMarkets.map((marketOption) => (
                  <SelectItem
                    key={marketOption.value}
                    value={marketOption.value}
                  >
                    {marketOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시가총액 */}
          <div className="space-y-1 lg:col-span-1 md:col-span-1 col-span-2">
            <label className="text-xs text-muted-foreground">
              시가총액 ({currencySymbol} 억 이상)
            </label>
            <Input
              type="number"
              value={marketCap}
              onChange={(e) => setMarketCap(e.target.value)}
              placeholder="시가총액"
              min="0"
              step="100"
            />
          </div>

          {/* 거래대금 */}
          <div className="space-y-1 lg:col-span-1 md:col-span-1 col-span-1">
            <label className="text-xs text-muted-foreground">
              거래대금 ({currencySymbol} 억 이상)
            </label>
            <Input
              type="number"
              value={tradingVolume}
              onChange={(e) => setTradingVolume(e.target.value)}
              placeholder="거래대금"
              min="0"
              step="10"
            />
          </div>

          {/* 시작일 */}
          <div className="space-y-1 lg:col-span-1 md:col-span-1 col-span-1">
            <label className="text-xs text-muted-foreground">시작일</label>
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder=""
              defaultCalendarDate="month-ago"
            />
          </div>

          {/* 종료일 */}
          <div className="space-y-1 lg:col-span-1 md:col-span-1 col-span-1">
            <label className="text-xs text-muted-foreground">종료일</label>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder=""
              defaultCalendarDate="today"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
