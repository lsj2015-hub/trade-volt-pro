'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, FileText, Brain, Plus, Trash2 } from 'lucide-react';

// 기본 키워드
const DEFAULT_KEYWORDS = [
  '수주',
  '호실적',
  '실적개선',
  '흑자전환',
  '영업이익 증가',
  '매출 증가',
  '사상 최대 실적',
  '분기 최대 실적',
  '실적 서프라이즈',
  '턴어라운드',
  '공급 계약',
  '장기 계약',
  '파트너십',
  '유통망 확보',
  '정부 지원',
  '정책 수혜',
  '규제 완화',
  '국책 과제 선정',
  'R&D 지원',
  '신기술 공개',
];

interface FilteringSectionProps {
  timeRange: number;
  setTimeRange: (value: number) => void;
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
  customKeywords: string[];
  setCustomKeywords: (keywords: string[]) => void;
  newKeyword: string;
  setNewKeyword: (keyword: string) => void;
  isSearching: boolean;
  isDartChecking: boolean;
  isEvaluating: boolean;
  hasSelectedNews: boolean;
  onSearchNews: () => void;
  onCheckDart: () => void;
  onEvaluateWithAI: () => void;
  onReset: () => void;
}

export const FilteringSection = ({
  timeRange,
  setTimeRange,
  selectedKeywords,
  setSelectedKeywords,
  customKeywords,
  setCustomKeywords,
  newKeyword,
  setNewKeyword,
  isSearching,
  isDartChecking,
  isEvaluating,
  hasSelectedNews,
  onSearchNews,
  onCheckDart,
  onEvaluateWithAI,
  onReset,
}: FilteringSectionProps) => {
  const addCustomKeyword = async () => {
    if (!newKeyword.trim()) return;

    try {
      setCustomKeywords([...customKeywords, newKeyword.trim()]);
      setNewKeyword('');
    } catch (error) {
      console.error('키워드 추가 실패:', error);
    }
  };

  const removeCustomKeyword = async (keyword: string) => {
    try {
      setCustomKeywords(customKeywords.filter((k) => k !== keyword));
    } catch (error) {
      console.error('키워드 삭제 실패:', error);
    }
  };

  // 키워드 개별 선택/해제
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(
      selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword]
    );
  };

  // 전체 키워드 선택/해제
  const toggleAllKeywords = () => {
    const allKeywords = [...DEFAULT_KEYWORDS, ...customKeywords];
    if (selectedKeywords.length === allKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords([...allKeywords]);
    }
  };

  // 선택된 키워드 개별 제거
  const removeSelectedKeyword = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
  };

  // 선택된 키워드 전체 제거
  const clearAllSelectedKeywords = () => {
    setSelectedKeywords([]);
  };

  const allKeywords = [...DEFAULT_KEYWORDS, ...customKeywords];
  const canSearch = timeRange > 0 && selectedKeywords.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold text-primary">검색 설정</label>
      </div>

      {/* 한 줄 레이아웃 */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-3 px-4 lg:pl-6">
        {/* 시간 범위 */}
        <div className="space-y-2 w-full sm:w-auto">
          <Select
            value={timeRange.toString()}
            onValueChange={(value) => setTimeRange(Number(value))}
          >
            <SelectTrigger className="w-full sm:w-32 lg:w-24 h-10">
              <SelectValue placeholder="시간 범위 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">몇 초전</SelectItem>
              <SelectItem value="60">1분</SelectItem>
              <SelectItem value="120">2분</SelectItem>
              <SelectItem value="300">5분</SelectItem>
              <SelectItem value="600">10분</SelectItem>
              <SelectItem value="1200">20분</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 키워드 선택 - Dropdown 형태 */}
        <div className="w-full sm:w-64 lg:w-48 space-y-2">
          <Select>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="필터링 키워드 선택" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedKeywords.length === allKeywords.length}
                    onCheckedChange={toggleAllKeywords}
                    id="select-all"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    전체 선택 ({selectedKeywords.length}/{allKeywords.length})
                  </label>
                </div>
                <div className="space-y-1">
                  {allKeywords.map((keyword) => (
                    <div key={keyword} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedKeywords.includes(keyword)}
                        onCheckedChange={() => toggleKeyword(keyword)}
                        id={keyword}
                      />
                      <label
                        htmlFor={keyword}
                        className="text-sm cursor-pointer"
                      >
                        {keyword}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            onClick={onSearchNews}
            disabled={isSearching || !canSearch}
            className="bg-slate-700 hover:bg-slate-600 h-10 text-sm"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            뉴스 검색
          </Button>

          <Button
            onClick={onCheckDart}
            disabled={!hasSelectedNews || isDartChecking}
            variant="outline"
            className="h-10 text-sm"
          >
            {isDartChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            공시 조회
          </Button>

          <Button
            onClick={onEvaluateWithAI}
            disabled={!hasSelectedNews || isEvaluating}
            variant="outline"
            className="h-10 text-sm"
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            David 평가
          </Button>

          <Button
            onClick={onReset}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 text-sm"
          >
            초기화
          </Button>
        </div>

        {/* 구분선 */}
        <div className="w-full border-t border-gray-300 my-4 lg:hidden"></div>
        <div className="hidden lg:block h-16 border-l border-gray-300 mx-2"></div>

        {/* 사용자 키워드 추가 */}
        <div className="space-y-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="사용자 키워드 추가"
              className="flex-1 sm:w-48 lg:w-40 h-10 text-sm"
              onKeyUp={(e) => e.key === 'Enter' && addCustomKeyword()}
            />
            <Button
              onClick={addCustomKeyword}
              disabled={!newKeyword.trim()}
              size="sm"
              className="h-10 px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 선택된 키워드 표시 */}
      {selectedKeywords.length > 0 && (
        <div className="space-y-2 px-4 lg:pl-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium">선택된 키워드</span>
            <Button
              onClick={clearAllSelectedKeywords}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
            >
              전체 해제
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="px-2 py-1 text-xs"
              >
                {keyword}
                <button
                  onClick={() => removeSelectedKeyword(keyword)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 사용자 키워드 목록 */}
      {customKeywords.length > 0 && (
        <div className="space-y-2 pl-6">
          <span className="text-sm font-medium">내 키워드</span>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((keyword) => (
              <Badge key={keyword} variant="outline" className="px-3 py-1">
                {keyword}
                <button
                  onClick={() => removeCustomKeyword(keyword)}
                  className="ml-2 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
