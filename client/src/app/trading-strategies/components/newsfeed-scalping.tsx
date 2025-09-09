'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Search,
  FileText,
  Brain,
  Plus,
  Trash2,
  Rss,
  Layers,
} from 'lucide-react';

// 수정된 타입 정의
interface NewsItem {
  id: string;
  company: string;
  title: string;
  summary: string;
  link: string;
  publishTime: string;
  selected?: boolean;
}

interface DartItem {
  id: string;
  company: string;
  dartLink: string;
  dartTitle: string;
  newsTitle: string;
  publishTime: string;
  selected?: boolean;
}

interface AIEvaluation {
  company: string;
  code: string;
  newsTitle: string;
  dartInfo?: string;
  evaluation: {
    단기_모멘텀_잠재력: { 점수: number; 이유: string };
    유동성_및_거래량_예상: { 점수: number; 이유: string };
    리스크_요인: { 이유: string };
    최종_스캘핑_적합성_판단: { 점수: number; 요약: string };
  };
  selected?: boolean;
}

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

export const NewsfeedScalping = () => {
  // 상태 관리
  const [timeRange, setTimeRange] = useState<number>(300);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const [newsResults, setNewsResults] = useState<NewsItem[]>([]);
  const [dartResults, setDartResults] = useState<DartItem[]>([]);
  const [aiResults, setAiResults] = useState<AIEvaluation[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [isDartChecking, setIsDartChecking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    loadCustomKeywords();
  }, []);

  const loadCustomKeywords = async () => {
    try {
      // TODO: API 호출로 사용자 키워드 로드
    } catch (error) {
      console.error('키워드 로드 실패:', error);
    }
  };

  const addCustomKeyword = async () => {
    if (!newKeyword.trim()) return;

    try {
      setCustomKeywords((prev) => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    } catch (error) {
      console.error('키워드 추가 실패:', error);
    }
  };

  const removeCustomKeyword = async (keyword: string) => {
    try {
      setCustomKeywords((prev) => prev.filter((k) => k !== keyword));
    } catch (error) {
      console.error('키워드 삭제 실패:', error);
    }
  };

  // 키워드 개별 선택/해제
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
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
    setSelectedKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  // 선택된 키워드 전체 제거
  const clearAllSelectedKeywords = () => {
    setSelectedKeywords([]);
  };

  // 뉴스 전체선택/해제
  const toggleAllNewsSelection = () => {
    const allSelected = newsResults.every((news) => news.selected);
    setNewsResults((prev) =>
      prev.map((news) => ({ ...news, selected: !allSelected }))
    );
  };

  // Dart 전체선택/해제
  const toggleAllDartSelection = () => {
    const allSelected = dartResults.every((dart) => dart.selected);
    setDartResults((prev) =>
      prev.map((dart) => ({ ...dart, selected: !allSelected }))
    );
  };

  const searchNews = async () => {
    setIsSearching(true);
    try {
      // 임시 데이터
      const mockNews: NewsItem[] = [
        {
          id: '1',
          company: 'HMM',
          title: 'HMM, 2분기 영업이익 2332억원…전년비 63.8% 감소',
          summary: 'HMM이 2분기 실적 부진을 발표했습니다...',
          link: 'https://news.naver.com/example1',
          publishTime: '2025-08-13 22:06:00',
        },
        {
          id: '2',
          company: '한화',
          title: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          summary: '한화호텔앤드리조트가 상반기 매출 증가를 기록했으나...',
          link: 'https://news.naver.com/example2',
          publishTime: '2025-08-13 22:04:00',
        },
        {
          id: '3',
          company: '삼성전자',
          title: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          summary: '한화호텔앤드리조트가 상반기 매출 증가를 기록했으나...',
          link: 'https://news.naver.com/example2',
          publishTime: '2025-08-13 22:04:00',
        },
        {
          id: '4',
          company: 'LG전자',
          title: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          summary: '한화호텔앤드리조트가 상반기 매출 증가를 기록했으나...',
          link: 'https://news.naver.com/example2',
          publishTime: '2025-08-13 22:04:00',
        },
        {
          id: '5',
          company: '한국전력',
          title: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          summary: '한화호텔앤드리조트가 상반기 매출 증가를 기록했으나...',
          link: 'https://news.naver.com/example2',
          publishTime: '2025-08-13 22:04:00',
        },
      ];

      setNewsResults(mockNews);
      setDartResults([]);
      setAiResults([]);
    } catch (error) {
      console.error('뉴스 검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const checkDart = async () => {
    const selectedNews = newsResults.filter((news) => news.selected);
    if (selectedNews.length === 0) {
      alert('공시조회할 뉴스를 선택해주세요.');
      return;
    }

    setIsDartChecking(true);
    try {
      const mockDartResults: DartItem[] = [
        {
          id: '1',
          company: 'HMM',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813000957',
          dartTitle: '반기보고서 (2025.06)',
          newsTitle: 'HMM, 2분기 영업이익 2332억원…전년비 63.8% 감소',
          publishTime: '2025-08-13 21:30:00',
        },
        {
          id: '2',
          company: '한화',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813801049',
          dartTitle: '[기재정정]기타경영사항(자율공시)',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          publishTime: '2025-08-13 20:45:00',
        },
        {
          id: '3',
          company: '삼성전자',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813801049',
          dartTitle: '[기재정정]기타경영사항(자율공시)',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          publishTime: '2025-08-13 20:45:00',
        },
        {
          id: '4',
          company: 'SK하이닉스',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813801049',
          dartTitle: '[기재정정]기타경영사항(자율공시)',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          publishTime: '2025-08-13 20:45:00',
        },
        {
          id: '5',
          company: 'NAVER',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813801049',
          dartTitle: '[기재정정]기타경영사항(자율공시)',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          publishTime: '2025-08-13 20:45:00',
        },
        {
          id: '6',
          company: '카카오',
          dartLink:
            'http://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250813801049',
          dartTitle: '[기재정정]기타경영사항(자율공시)',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          publishTime: '2025-08-13 20:45:00',
        },
      ];

      setDartResults(mockDartResults);
    } catch (error) {
      console.error('공시조회 실패:', error);
    } finally {
      setIsDartChecking(false);
    }
  };

  const evaluateWithAI = async () => {
    const selectedNews = newsResults.filter((news) => news.selected);
    if (selectedNews.length === 0) {
      alert('평가할 뉴스를 선택해주세요.');
      return;
    }

    setIsEvaluating(true);
    try {
      const mockAIResults: AIEvaluation[] = [
        {
          company: 'HMM',
          code: '011200',
          newsTitle: 'HMM, 2분기 영업이익 2332억원…전년비 63.8% 감소',
          dartInfo: '반기보고서 (2025.06)',
          evaluation: {
            단기_모멘텀_잠재력: {
              점수: 3,
              이유: 'HMM의 실적 발표는 전반적으로 부진한 내용을 포함하고 있어 시장에 단기적으로 부정적인 영향을 미칠 가능성이 큽니다. 다만, 이미 시장에 일부 반영되었을 수 있으며, 해운 업계의 전반적인 추세에 따라서 주가 변동이 강하지 않을 수도 있습니다.',
            },
            유동성_및_거래량_예상: {
              점수: 3,
              이유: 'HMM은 주요 기업 중 하나로 통상적인 거래량이 많습니다. 이번 부진한 실적 발표로 인해 초기에는 거래량이 증가할 수 있지만, 해운 업계의 전체 상황과 맞물려 큰 폭의 변화는 아닐 수 있습니다.',
            },
            리스크_요인: {
              이유: '스캘핑 시 글로벌 해운 업계의 전반적인 경기 및 지속적인 운임 변동성에 주의해야 합니다. 또한, 이러한 실적 부진이 장기적인 하락세의 시작일 가능성도 배제할 수 없습니다.',
            },
            최종_스캘핑_적합성_판단: {
              점수: 3,
              요약: 'HMM의 실적 부진 뉴스는 단기적으로 모멘텀 스캘핑에 중립적인 영향을 미칠 것으로 보입니다. 실적 부진 자체가 다소 예측 가능성이 있었고, 큰 반사작용은 제한적일 수 있으나, 단기적 전략으로 작은 변동성을 포착할 가능성은 존재합니다.',
            },
          },
        },
        {
          company: '한화',
          code: '000880',
          newsTitle: '한화호텔앤드리조트, 상반기 매출 급증에도 흑자 전환 숙제',
          dartInfo: '[기재정정]기타경영사항(자율공시)',
          evaluation: {
            단기_모멘텀_잠재력: {
              점수: 3,
              이유: '매출 급증과 비용 구조 개선은 긍정적인 요인이나, 흑자 전환까지 시간이 필요하다는 점에서 주가 급등을 예상하기 어렵습니다. 이런 뉴스는 주가에 일시적인 변화를 줄 수 있지만, 그 영향은 제한적일 가능성이 큽니다.',
            },
            유동성_및_거래량_예상: {
              점수: 2,
              이유: '해당 뉴스는 기업 실적과 관련된 주요 정보이긴 하지만 투자자들의 즉각적인 거래 활동을 크게 증가시키기에는 미흡한 부분이 있습니다. 추가적인 기업 전략이나 외부 긍정적 요인이 동반되지 않으면 폭발적 거래량은 어려울 수 있습니다.',
            },
            리스크_요인: {
              이유: '흑자 전환이 지연된다는 점에서 투자자 실망이 있을 수 있고, 금융 비용에 대한 부담이 클 수 있습니다. 이로 인해 실적 개선에 대한 지속 불확실성이 주가 변동성을 증가시킬 수 있습니다.',
            },
            최종_스캘핑_적합성_판단: {
              점수: 2,
              요약: '매출 증가에도 불구하고 흑자 전환의 불확실성은 뉴스 모멘텀 스캘핑에 긍정적이지 않습니다. 제한적인 거래량 증가와 변동성을 감안할 때, 이 종목은 스캘핑보다는 중장기적인 시각에서 접근하는 것이 더 나을 수 있습니다.',
            },
          },
        },
      ];

      setAiResults(mockAIResults);
    } catch (error) {
      console.error('AI 평가 실패:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleNewsSelection = (newsId: string) => {
    setNewsResults((prev) =>
      prev.map((news) =>
        news.id === newsId ? { ...news, selected: !news.selected } : news
      )
    );
  };

  const toggleDartSelection = (newsId: string) => {
    setDartResults((prev) =>
      prev.map((dart) =>
        dart.id === newsId ? { ...dart, selected: !dart.selected } : dart
      )
    );
  };

  const toggleAIResultSelection = (company: string) => {
    setAiResults((prev) =>
      prev.map((result) =>
        result.company === company
          ? { ...result, selected: !result.selected }
          : result
      )
    );
  };

  // 초기화 함수
  const handleReset = () => {
    setTimeRange(300);
    setSelectedKeywords([]);
    setNewKeyword('');
    setNewsResults([]);
    setDartResults([]);
    setAiResults([]);
    setIsSearching(false);
    setIsDartChecking(false);
    setIsEvaluating(false);
  };

  const allKeywords = [...DEFAULT_KEYWORDS, ...customKeywords];
  const hasNewsResults = newsResults.length > 0;
  const hasSelectedNews = newsResults.some((news) => news.selected);
  const canSearch = timeRange > 0 && selectedKeywords.length > 0;

  return (
    <Card className="min-h-[200px] border-none bg-transparent">
      <CardContent className="space-y-4 lg:space-y-6 px-4 lg:px-6 py-0">
        <p className="text-muted-foreground text-sm">
          최근 뉴스를 키워드로 필터링하여 공시정보를 확인하고 AI 투자 판단을
          통해 스캘핑 후보 종목을 선별합니다.
        </p>

        {/* 검색 설정 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <label className="text-sm font-semibold text-primary">
              검색 설정
            </label>
          </div>

          {/* 한 줄 레이아웃 */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-3 px-4 lg:pl-6">
            {/* 시간 범위 */}
            <div className="space-y-2 w-full sm:w-auto">
              <Label className="text-sm font-medium">몇 초전 뉴스까지</Label>
              <Input
                type="number"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="w-full sm:w-32 lg:w-24 text-center h-10"
                placeholder="300"
              />
            </div>

            {/* 키워드 선택 - Dropdown 형태 */}
            <div className="w-full sm:w-64 lg:w-48 space-y-2">
              <Label className="text-sm font-medium">필터링 키워드</Label>
              <Select>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="키워드를 선택하세요" />
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
                        전체 선택 ({selectedKeywords.length}/
                        {allKeywords.length})
                      </label>
                    </div>
                    <div className="space-y-1">
                      {allKeywords.map((keyword) => (
                        <div
                          key={keyword}
                          className="flex items-center space-x-2"
                        >
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
                onClick={searchNews}
                disabled={isSearching || !canSearch}
                className="bg-slate-700 hover:bg-slate-600 h-10 text-sm"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                뉴스 검색
              </Button>

              <Button
                onClick={checkDart}
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
                onClick={evaluateWithAI}
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
                onClick={handleReset}
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
              <Label className="text-sm font-medium">사용자 키워드 추가</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="새 키워드"
                  className="flex-1 sm:w-40 lg:w-32 h-10 text-sm"
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
                <Label className="text-sm font-medium">선택된 키워드</Label>
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
              <Label className="text-sm font-medium">내 키워드</Label>
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

        {/* 결과 표시 영역 */}
        <div className="border rounded-lg bg-muted/20">
          {!hasNewsResults ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                조건을 선택하여 조회하면 요청한 데이터가 여기로 나옵니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 뉴스 검색 결과 */}
              <NewsResultsSection
                newsResults={newsResults}
                onToggleSelection={toggleNewsSelection}
                onToggleAllSelection={toggleAllNewsSelection}
              />

              {/* 공시조회 결과 */}
              {dartResults.length > 0 && (
                <DartResultsSection
                  dartResults={dartResults}
                  onToggleSelection={toggleDartSelection}
                  onToggleAllSelection={toggleAllDartSelection}
                />
              )}

              {/* AI 평가 결과 */}
              {aiResults.length > 0 && (
                <AIEvaluationSection
                  aiResults={aiResults}
                  onToggleSelection={toggleAIResultSelection}
                />
              )}

              {/* 최종 스켈핑 종목 */}
              {aiResults.length > 0 && (
                <FinalScalpingSection aiResults={aiResults} />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 나머지 컴포넌트들은 동일...
const NewsResultsSection = ({
  newsResults,
  onToggleSelection,
  onToggleAllSelection,
}: {
  newsResults: NewsItem[];
  onToggleSelection: (newsId: string) => void;
  onToggleAllSelection: () => void;
}) => {
  const allSelected =
    newsResults.length > 0 && newsResults.every((news) => news.selected);

  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Rss className="h-4 w-4" />
          <h3 className="font-semibold">뉴스 검색 결과</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAllSelection}
          />
          <span className="text-sm font-medium">전체선택</span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left text-sm p-2 w-12">선택</th>
                <th className="text-center text-sm p-2 w-[150px]">회사명</th>
                <th className="text-center text-sm p-2 w-[300px]">제목</th>
                <th className="text-center text-sm p-2 w-[300px]">뉴스 요약</th>
                <th className="text-center text-sm p-2">발행시간</th>
              </tr>
            </thead>
            <tbody>
              {newsResults.map((news) => (
                <tr key={news.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <Checkbox
                      checked={news.selected || false}
                      onCheckedChange={() => onToggleSelection(news.id)}
                    />
                  </td>
                  <td className="p-2 text-sm font-medium">{news.company}</td>
                  <td className="p-2 text-sm">
                    <a
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline truncate"
                    >
                      {news.title}
                    </a>
                  </td>
                  <td className="p-2 text-sm truncate">{news.summary}</td>
                  <td className="p-2 text-xs text-right text-muted-foreground">
                    {news.publishTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 */}
        <div className="block md:hidden space-y-3">
          {newsResults.map((news) => (
            <div key={news.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={news.selected || false}
                  onCheckedChange={() => onToggleSelection(news.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{news.company}</span>
                    <span className="text-xs text-muted-foreground">
                      {news.publishTime}
                    </span>
                  </div>
                  <a
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline block"
                  >
                    {news.title}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {news.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DartResultsSection = ({
  dartResults,
  onToggleSelection,
  onToggleAllSelection,
}: {
  dartResults: DartItem[];
  onToggleSelection: (dartId: string) => void;
  onToggleAllSelection: () => void;
}) => {
  const allSelected =
    dartResults.length > 0 && dartResults.every((dart) => dart.selected);

  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <h3 className="font-semibold">Dart 검증 통과 종목</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAllSelection}
          />
          <span className="text-sm font-medium">전체선택</span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left text-sm p-2 w-12">선택</th>
                <th className="text-center text-sm p-2 w-[150px]">회사명</th>
                <th className="text-center text-sm p-2 w-[300px]">관련 공시</th>
                <th className="text-center text-sm p-2 w-[300px]">뉴스 제목</th>
                <th className="text-center text-sm p-2">공시시간</th>
              </tr>
            </thead>
            <tbody>
              {dartResults.map((dart) => (
                <tr key={dart.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <Checkbox
                      checked={dart.selected || false}
                      onCheckedChange={() => onToggleSelection(dart.id)}
                    />
                  </td>
                  <td className="p-2 font-medium text-sm">{dart.company}</td>
                  <td className="p-2">
                    <a
                      href={dart.dartLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate"
                    >
                      {dart.dartTitle}
                    </a>
                  </td>
                  <td className="p-2 text-sm truncate">{dart.newsTitle}</td>
                  <td className="p-2 text-right text-xs text-muted-foreground">
                    {dart.publishTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 */}
        <div className="block md:hidden space-y-3">
          {dartResults.map((dart) => (
            <div key={dart.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={dart.selected || false}
                  onCheckedChange={() => onToggleSelection(dart.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{dart.company}</span>
                    <span className="text-xs text-muted-foreground">
                      {dart.publishTime}
                    </span>
                  </div>
                  <a
                    href={dart.dartLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline block"
                  >
                    {dart.dartTitle}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {dart.newsTitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 수정된 AI 평가 결과 컴포넌트
const AIEvaluationSection = ({
  aiResults,
  onToggleSelection,
}: {
  aiResults: AIEvaluation[];
  onToggleSelection: (company: string) => void;
}) => {
  return (
    <div className="p-4 border-t">
      <div className="flex items-center space-x-2 mb-3">
        <Brain className="h-4 w-4" />
        <h3 className="font-semibold">최종 스캘핑 후보 종목</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-6">
          {aiResults.map((result, index) => (
            <div
              key={index}
              className="border rounded-lg bg-white shadow-sm relative"
            >
              {/* 헤더: 체크박스 + 종목명 + 점수 뱃지 */}
              <div className="p-3 md:p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={result.selected || false}
                      onCheckedChange={() => onToggleSelection(result.company)}
                    />
                    <div>
                      <h4 className="text-lg md:text-xl font-bold text-gray-900">
                        '{result.company}' AI 평가 결과
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        종목코드: {result.code}
                      </p>
                    </div>
                  </div>
                  <Badge className="text-base md:text-lg px-2 md:px-3 py-1 bg-red-500 text-white self-start sm:self-auto">
                    {result.evaluation.최종_스캘핑_적합성_판단.점수}/5
                  </Badge>
                </div>
              </div>

              {/* 컨텐츠 */}
              <div className="p-4 space-y-4">
                {/* 뉴스 및 공시 정보 */}
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>뉴스:</strong> {result.newsTitle}
                  </p>
                  {result.dartInfo && (
                    <p>
                      <strong>공시:</strong> {result.dartInfo}
                    </p>
                  )}
                </div>

                {/* 평가 항목들 - 모두 column 배치 */}
                <div className="space-y-3 md:space-y-4">
                  {/* 각 평가 항목의 패딩을 줄이고 텍스트 크기 조정 */}
                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h5 className="font-semibold text-blue-900 text-sm md:text-base">
                        단기 모멘텀 잠재력
                      </h5>
                      <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs self-start sm:self-auto">
                        {result.evaluation.단기_모멘텀_잠재력.점수}/5
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-blue-800">
                      {result.evaluation.단기_모멘텀_잠재력.이유}
                    </p>
                  </div>
                  {/* 다른 평가 항목들도 동일하게... */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 최종 스켈핑 종목 컴포넌트
const FinalScalpingSection = ({ aiResults }: { aiResults: AIEvaluation[] }) => {
  const selectedResults = aiResults.filter((result) => result.selected);

  if (selectedResults.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-t">
      <div className="flex items-center space-x-2 mb-3">
        <Layers className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-green-800">최종 스켈핑 종목</h3>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedResults.map((result, index) => (
            <div
              key={index}
              className="bg-white p-3 rounded-lg border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-row items-center">
                  <h4 className="font-bold text-gray-900 mr-2">
                    {result.company}
                  </h4>
                  <p className="text-sm text-gray-600">({result.code})</p>
                </div>
                <Badge className="bg-red-600 text-white">
                  {result.evaluation.최종_스캘핑_적합성_판단.점수}/5
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-sm text-green-700">
            총 {selectedResults.length}개 종목이 최종 스켈핑 대상으로
            선정되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
