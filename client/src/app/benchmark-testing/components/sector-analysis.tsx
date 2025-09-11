'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BarChart, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn, getDefaultDates } from '@/lib/utils';

// 상수 정의
const MARKET_OPTIONS = [
  { value: 'indexes', label: 'INDEXES' },
  { value: 'kospi', label: 'KOSPI' },
  { value: 'kosdaq', label: 'KOSDAQ' },
  { value: 'us-stock', label: 'US-STOCKS' },
  { value: 'jp-stock', label: 'JP-STOCKS' },
  { value: 'ch-stock', label: 'CH-STOCKS' },
  { value: 'vn-stock', label: 'VN-STOCKS' },
  { value: 'hk-stock', label: 'HK-STOCKS' },
];

const INDEX_OPTIONS = [
  { value: 'kospi', label: 'KOSPI 지수' },
  { value: 'kosdaq', label: 'KOSDAQ 지수' },
  { value: 'kospi200', label: 'KOSPI200' },
  { value: 'kospi100', label: 'KOSPI100' },
  { value: 'sp500', label: 'S&P 500' },
  { value: 'nasdaq', label: 'NASDAQ' },
  { value: 'dow', label: 'DOW' },
  { value: 'nikkei225', label: '닛케이225' },
  { value: 'topix', label: 'TOPIX' },
  { value: 'shanghai', label: '상하이종합' },
  { value: 'shenzhen', label: '선전종합' },
  { value: 'vnindex', label: 'VN-Index' },
  { value: 'hangseng', label: '항셍지수' },
];

const KOSPI_SIZE_OPTIONS = [
  { value: '0002', label: '대형주' },
  { value: '0003', label: '중형주' },
  { value: '0004', label: '소형주' },
];

const KOSPI_SECTOR_OPTIONS = [
  { value: '0005', label: '음식료·담배' },
  { value: '0006', label: '섬유·의류' },
  { value: '0007', label: '종이·목재' },
  { value: '0008', label: '화학' },
  { value: '0009', label: '제약' },
  { value: '0010', label: '비금속' },
  { value: '0011', label: '금속' },
  { value: '0012', label: '기계·장비' },
  { value: '0013', label: '전기·전자' },
  { value: '0014', label: '의료·정밀기기' },
  { value: '0015', label: '운송장비·부품' },
  { value: '0016', label: '유통' },
  { value: '0017', label: '전기·가스' },
  { value: '0018', label: '건설' },
  { value: '0019', label: '운송·창고' },
  { value: '0020', label: '통신' },
  { value: '0021', label: '금융' },
  { value: '0024', label: '증권' },
  { value: '0025', label: '보험' },
  { value: '0026', label: '일반서비스' },
];

const KOSDAQ_SECTOR_OPTIONS = [
  { value: '1006', label: '일반서비스' },
  { value: '1010', label: '건설' },
  { value: '1011', label: '유통' },
  { value: '1013', label: '운송·창고' },
  { value: '1014', label: '금융' },
  { value: '1015', label: '오락·문화' },
  { value: '1019', label: '음식료·담배' },
  { value: '1020', label: '섬유·의류' },
  { value: '1021', label: '종이·목재' },
  { value: '1022', label: '출판·매체복제' },
  { value: '1023', label: '화학' },
  { value: '1024', label: '제약' },
  { value: '1025', label: '비금속' },
  { value: '1026', label: '금속' },
  { value: '1027', label: '기계·장비' },
  { value: '1028', label: '전기·전자' },
  { value: '1029', label: '의료·정밀기기' },
  { value: '1030', label: '운송장비·부품' },
  { value: '1031', label: '기타제조' },
];

const OVERSEAS_SECTOR_OPTIONS = [
  { value: '000', label: '전체' },
  { value: '010', label: '에너지 및 관련 서비스' },
  { value: '110', label: '화학' },
  { value: '120', label: '건축자재' },
  { value: '130', label: '금속&채광' },
  { value: '140', label: '소재산업' },
  { value: '210', label: '우주항공 및 국방' },
  { value: '220', label: '건설 및 건축제품' },
  { value: '230', label: '기계 및 전기장비' },
  { value: '240', label: '복합기업' },
  { value: '250', label: '무역회사' },
  { value: '260', label: '상업 및 전문서비스' },
  { value: '270', label: '항공사 및 항공운송' },
  { value: '280', label: '해운' },
  { value: '290', label: '운송인프라' },
  { value: '310', label: '자동차' },
  { value: '320', label: '자동차관련부품' },
  { value: '330', label: '섬유의복 및 호화제품' },
  { value: '340', label: '가정용 내구재' },
  { value: '350', label: '여행서비스 및 제품' },
  { value: '360', label: '소비자 서비스' },
  { value: '370', label: '미디어' },
  { value: '380', label: '도/소매' },
  { value: '410', label: '음식료 및 담배생산' },
  { value: '420', label: '가정 및 개인용품' },
  { value: '430', label: '음식료 도매' },
  { value: '510', label: '건강관리장비 및 서비스' },
  { value: '520', label: '제약' },
  { value: '530', label: '바이오' },
  { value: '610', label: '상업은행' },
  { value: '620', label: '보험' },
  { value: '630', label: "REIT's 및 부동산관리개발" },
  { value: '640', label: '금융서비스' },
  { value: '710', label: '반도체 및 반도체장비' },
  { value: '720', label: '인터넷소프트웨어 및 IT서비스' },
  { value: '730', label: '컴퓨터전자장비/기기' },
  { value: '740', label: '통신장비' },
  { value: '810', label: '유선 및 기타 통신' },
  { value: '820', label: '무선통신' },
  { value: '910', label: '전기' },
  { value: '920', label: '가스' },
  { value: '930', label: '공익사업' },
];

// Multi-Select Combobox 컴포넌트
interface MultiSelectComboboxProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  className?: string;
}

const MultiSelectCombobox = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  className,
}: MultiSelectComboboxProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    return `${selectedValues.length}개 선택됨`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {getDisplayText()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="검색..." className="my-3 h-4" />
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup className="max-h-64 w-[200px] overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedValues.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const SectorAnalysis = () => {
  // 기본 상태
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedMarket, setSelectedMarket] = useState('');

  // Multi-Select 상태들
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [kospiSectorGroup, setKospiSectorGroup] = useState('');
  const [selectedKospiSizes, setSelectedKospiSizes] = useState<string[]>([]);
  const [selectedKospiSectors, setSelectedKospiSectors] = useState<string[]>(
    []
  );
  const [selectedKosdaqSectors, setSelectedKosdaqSectors] = useState<string[]>(
    []
  );
  const [selectedOverseasSectors, setSelectedOverseasSectors] = useState<
    string[]
  >([]);

  // 결과 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // 선택된 모든 필터들을 통합해서 가져오는 함수
  const getAllSelectedFilters = () => {
    const filters: {
      type: string;
      value: string;
      label: string;
      removeHandler: () => void;
    }[] = [];

    // Indexes
    selectedIndexes.forEach((value) => {
      const option = INDEX_OPTIONS.find((opt) => opt.value === value);
      if (option) {
        filters.push({
          type: 'index',
          value,
          label: option.label,
          removeHandler: () =>
            setSelectedIndexes((prev) => prev.filter((v) => v !== value)),
        });
      }
    });

    // KOSPI Sizes
    selectedKospiSizes.forEach((value) => {
      const option = KOSPI_SIZE_OPTIONS.find((opt) => opt.value === value);
      if (option) {
        filters.push({
          type: 'kospi-size',
          value,
          label: option.label,
          removeHandler: () =>
            setSelectedKospiSizes((prev) => prev.filter((v) => v !== value)),
        });
      }
    });

    // KOSPI Sectors
    selectedKospiSectors.forEach((value) => {
      const option = KOSPI_SECTOR_OPTIONS.find((opt) => opt.value === value);
      if (option) {
        filters.push({
          type: 'kospi-sector',
          value,
          label: option.label,
          removeHandler: () =>
            setSelectedKospiSectors((prev) => prev.filter((v) => v !== value)),
        });
      }
    });

    // KOSDAQ Sectors
    selectedKosdaqSectors.forEach((value) => {
      const option = KOSDAQ_SECTOR_OPTIONS.find((opt) => opt.value === value);
      if (option) {
        filters.push({
          type: 'kosdaq-sector',
          value,
          label: option.label,
          removeHandler: () =>
            setSelectedKosdaqSectors((prev) => prev.filter((v) => v !== value)),
        });
      }
    });

    // Overseas Sectors
    selectedOverseasSectors.forEach((value) => {
      const option = OVERSEAS_SECTOR_OPTIONS.find((opt) => opt.value === value);
      if (option) {
        filters.push({
          type: 'overseas-sector',
          value,
          label: option.label,
          removeHandler: () =>
            setSelectedOverseasSectors((prev) =>
              prev.filter((v) => v !== value)
            ),
        });
      }
    });

    return filters;
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    const { today: newToday, sevenDaysAgo: newSevenDaysAgo } =
      getDefaultDates();
    setStartDate(newSevenDaysAgo);
    setEndDate(newToday);
    setSelectedMarket('');
    setSelectedIndexes([]);
    setKospiSectorGroup('');
    setSelectedKospiSizes([]);
    setSelectedKospiSectors([]);
    setSelectedKosdaqSectors([]);
    setSelectedOverseasSectors([]);
  };

  // 분석 실행/초기화
  const handleAnalysis = () => {
    // 이미 결과가 있으면 초기화
    if (hasResults) {
      setHasResults(false);
      resetFilters();
      return;
    }

    // 새로운 분석 실행
    if (!startDate || !endDate || !selectedMarket) {
      alert('시작일, 종료일, 시장을 선택해주세요.');
      return;
    }

    // 선택된 필터 확인
    const allSelectedFilters = getAllSelectedFilters();
    if (allSelectedFilters.length === 0) {
      alert('하나 이상의 섹터 또는 지수를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    console.log('섹터 수익률 분석 실행:', {
      startDate,
      endDate,
      selectedMarket,
      selectedIndexes,
      kospiSectorGroup,
      selectedKospiSizes,
      selectedKospiSectors,
      selectedKosdaqSectors,
      selectedOverseasSectors,
    });

    // 임시로 2초 후 결과 표시
    setTimeout(() => {
      setIsLoading(false);
      setHasResults(true);
    }, 2000);
  };

  // 시장 변경 시 초기화
  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
    setSelectedIndexes([]);
    setKospiSectorGroup('');
    setSelectedKospiSizes([]);
    setSelectedKospiSectors([]);
    setSelectedKosdaqSectors([]);
    setSelectedOverseasSectors([]);
  };

  // KOSPI 섹터 그룹 변경 시 초기화
  const handleKospiSectorGroupChange = (group: string) => {
    setKospiSectorGroup(group);
    setSelectedKospiSizes([]);
    setSelectedKospiSectors([]);
  };

  // 해외 주식 시장인지 확인
  const isOverseasMarket = (market: string) => {
    return [
      'us-stock',
      'jp-stock',
      'ch-stock',
      'vn-stock',
      'hk-stock',
    ].includes(market);
  };

  const allSelectedFilters = getAllSelectedFilters();

  return (
    <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <BarChart className="h-5 w-5" />
          섹터 수익률 비교 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          여러 섹터를 선택하여 기간별 누적 수익률을 비교해보세요.
        </p>

        {/* 기본 설정 + 세부 옵션 통합 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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

          <div className="space-y-2">
            <Select value={selectedMarket} onValueChange={handleMarketChange}>
              <SelectTrigger>
                <SelectValue placeholder="시장 선택..." />
              </SelectTrigger>
              <SelectContent>
                {MARKET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 세부 옵션들 - 데스크탑에서 같은 줄에 표시 */}

          {/* Indexes 선택 시 */}
          {selectedMarket === 'indexes' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                지수 선택 (다중 선택)
              </label>
              <MultiSelectCombobox
                options={INDEX_OPTIONS}
                selectedValues={selectedIndexes}
                onSelectionChange={setSelectedIndexes}
                placeholder="선택..."
                className="w-full justify-between text-muted-foreground"
              />
            </div>
          )}

          {/* KOSPI 선택 시 */}
          {selectedMarket === 'kospi' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">섹터 그룹</label>

              <div className="space-y-2">
                {/* 섹터 그룹 버튼 */}
                <div className="flex gap-1">
                  <Button
                    variant={
                      kospiSectorGroup === 'size' ? 'default' : 'outline'
                    }
                    onClick={() => handleKospiSectorGroupChange('size')}
                    className="text-xs px-2 py-1 h-7 flex-1"
                  >
                    SIZE
                  </Button>
                  <Button
                    variant={
                      kospiSectorGroup === 'sectors' ? 'default' : 'outline'
                    }
                    onClick={() => handleKospiSectorGroupChange('sectors')}
                    className="text-xs px-2 py-1 h-7 flex-1"
                  >
                    SEC
                  </Button>
                </div>

                {/* 항상 표시되는 combobox - 선택에 따라 옵션과 활성화 상태 변경 */}
                <div className="relative">
                  {kospiSectorGroup === 'size' ? (
                    <MultiSelectCombobox
                      options={KOSPI_SIZE_OPTIONS}
                      selectedValues={selectedKospiSizes}
                      onSelectionChange={setSelectedKospiSizes}
                      placeholder="선택..."
                      className="w-full text-muted-foreground"
                    />
                  ) : kospiSectorGroup === 'sectors' ? (
                    <MultiSelectCombobox
                      options={KOSPI_SECTOR_OPTIONS}
                      selectedValues={selectedKospiSectors}
                      onSelectionChange={setSelectedKospiSectors}
                      placeholder="선택..."
                      className="w-full text-muted-foreground"
                    />
                  ) : (
                    // 버튼을 선택하기 전까지는 비활성화된 combobox 표시
                    <Button
                      variant="outline"
                      disabled
                      className="w-full justify-between cursor-not-allowed opacity-50 text-muted-foreground"
                    >
                      SIZE 또는 SEC 선택...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KOSDAQ 선택 시 */}
          {selectedMarket === 'kosdaq' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">KOSDAQ 섹터 (다중)</label>
              <MultiSelectCombobox
                options={KOSDAQ_SECTOR_OPTIONS}
                selectedValues={selectedKosdaqSectors}
                onSelectionChange={setSelectedKosdaqSectors}
                placeholder="선택..."
                className="w-full text-muted-foreground"
              />
            </div>
          )}

          {/* 해외 주식 선택 시 */}
          {isOverseasMarket(selectedMarket) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">해외 섹터 (다중)</label>
              <MultiSelectCombobox
                options={OVERSEAS_SECTOR_OPTIONS}
                selectedValues={selectedOverseasSectors}
                onSelectionChange={setSelectedOverseasSectors}
                placeholder="선택..."
                className="w-full text-muted-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              className={`w-full ${
                hasResults
                  ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              onClick={handleAnalysis}
              disabled={isLoading}
            >
              {isLoading ? '분석 중...' : hasResults ? '초기화' : '분석 실행'}
            </Button>
          </div>
        </div>

        {/* 선택된 필터들 표시 영역 */}
        {allSelectedFilters.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                선택된 필터 ({allSelectedFilters.length}개)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIndexes([]);
                  setSelectedKospiSizes([]);
                  setSelectedKospiSectors([]);
                  setSelectedKosdaqSectors([]);
                  setSelectedOverseasSectors([]);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                전체 해제
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSelectedFilters.map((filter, index) => (
                <Badge
                  key={`${filter.type}-${filter.value}-${index}`}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  {filter.label}
                  <X
                    className="ml-2 h-4 w-4 cursor-pointer hover:text-destructive"
                    onClick={filter.removeHandler}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 조회 결과 표시 영역 */}
        <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
          <p className="text-muted-foreground text-center">
            조건을 선택하여 분석 실행하면 선택된 여러 섹터의 기간 수익률
            그래프가 여기에 표시됩니다.
          </p>
          {/* TODO: 차트 컴포넌트 추가 */}
        </div>
      </CardContent>
    </Card>
  );
};
