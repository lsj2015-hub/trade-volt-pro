'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Clock, TrendingUp } from 'lucide-react';

interface FilteringSectionProps {
  afterHourReturnMin: number;
  setAfterHourReturnMin: (value: number) => void;
  afterHourReturnMax: number; // 사용하지 않지만 인터페이스 유지
  setAfterHourReturnMax: (value: number) => void; // 사용하지 않지만 인터페이스 유지
  marketReturnMin: number;
  setMarketReturnMin: (value: number) => void;
  marketReturnMax: number; // 사용하지 않지만 인터페이스 유지
  setMarketReturnMax: (value: number) => void; // 사용하지 않지만 인터페이스 유지
  selectedReportTimes: string[];
  setSelectedReportTimes: (times: string[]) => void;
  reportTimeOptions: string[];
  isSearching: boolean;
  onSearchStocks: () => void;
  onReset: () => void;
  currentTime: string;
}

export const FilteringSection = ({
  afterHourReturnMin,
  setAfterHourReturnMin,
  marketReturnMin,
  setMarketReturnMin,
  selectedReportTimes,
  setSelectedReportTimes,
  reportTimeOptions,
  isSearching,
  onSearchStocks,
  onReset,
  currentTime,
}: FilteringSectionProps) => {
  const toggleReportTime = (time: string) => {
    setSelectedReportTimes(
      selectedReportTimes.includes(time)
        ? selectedReportTimes.filter((t) => t !== time)
        : [...selectedReportTimes, time]
    );
  };

  const toggleAllReportTimes = () => {
    if (selectedReportTimes.length === reportTimeOptions.length) {
      setSelectedReportTimes([]);
    } else {
      setSelectedReportTimes([...reportTimeOptions]);
    }
  };

  const removeSelectedTime = (time: string) => {
    setSelectedReportTimes(selectedReportTimes.filter((t) => t !== time));
  };

  const canSearch = selectedReportTimes.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold text-primary">
          갭 트레이딩 설정
        </label>
      </div>

      {/* 필터링 조건 - iPad Pro에서만 2줄, 1030px 이상은 기존 1줄 유지 */}
      <div className="px-4 xl:pl-6">
        {/* md~lg: 2줄 레이아웃, xl 이상: 1줄 레이아웃 */}
        <div className="flex flex-col md:space-y-4 xl:space-y-0 xl:flex-row xl:items-center gap-2 xl:gap-6">
          {/* 첫 번째 그룹: 시간외 상승률, 본장 상승률 */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {/* 시간외 상승률 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                시간외 상승률 (%)
              </label>
              <Input
                type="number"
                value={afterHourReturnMin}
                onChange={(e) => setAfterHourReturnMin(Number(e.target.value))}
                className="w-20 h-10 text-sm"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">이상</span>
            </div>

            {/* 본장 상승률 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                본장 상승률 (%)
              </label>
              <Input
                type="number"
                value={marketReturnMin}
                onChange={(e) => setMarketReturnMin(Number(e.target.value))}
                className="w-20 h-10 text-sm"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">이상</span>
            </div>
          </div>

          {/* 두 번째 그룹: 보고시간 선택, 버튼들 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 xl:gap-6">
            {/* 보고시간 선택 */}
            <div className="w-full sm:w-64 xl:w-48">
              <Select>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="보고시간 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          selectedReportTimes.length ===
                          reportTimeOptions.length
                        }
                        onCheckedChange={toggleAllReportTimes}
                        id="select-all-times"
                      />
                      <label
                        htmlFor="select-all-times"
                        className="text-sm font-medium cursor-pointer"
                      >
                        전체 선택 ({selectedReportTimes.length}/
                        {reportTimeOptions.length})
                      </label>
                    </div>
                    <div className="space-y-1">
                      {reportTimeOptions.map((time) => (
                        <div key={time} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedReportTimes.includes(time)}
                            onCheckedChange={() => toggleReportTime(time)}
                            id={time}
                          />
                          <label
                            htmlFor={time}
                            className={`text-sm cursor-pointer ${
                              time === currentTime
                                ? 'font-bold text-primary'
                                : ''
                            }`}
                          >
                            {time} {time === currentTime && '(현재)'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
              <Button
                onClick={onSearchStocks}
                disabled={isSearching || !canSearch}
                className="bg-slate-700 hover:bg-slate-600 h-10 text-sm w-[130px]"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                종목 검색
              </Button>

              <Button
                onClick={onReset}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 text-sm h-10 w-[130px]"
              >
                초기화
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 선택된 보고시간 표시 */}
      {selectedReportTimes.length > 0 && (
        <div className="space-y-2 px-4 xl:pl-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">선택된 보고시간</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedReportTimes.map((time) => (
              <Badge
                key={time}
                variant={time === currentTime ? 'default' : 'secondary'}
                className="px-2 py-1 text-xs"
              >
                {time} {time === currentTime && '(현재)'}
                <button
                  onClick={() => removeSelectedTime(time)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
