'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FilteringSection } from '../components/newsfeed-scalping/filtering-section';
import { NewsResultsSection } from '../components/newsfeed-scalping/news-results-section';
import { DartResultsSection } from '../components/newsfeed-scalping/dart-results-section';
import { AIEvaluationSection } from '../components/newsfeed-scalping/ai-evaluation-section';
import { SelectedStock, StrategyComponentProps } from '@/types/types';

// 타입 정의
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

export const NewsfeedScalping = ({
  onSelectedStocksChange,
}: StrategyComponentProps) => {
  // 상태 관리
  const [timeRange, setTimeRange] = useState<number>(0);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const [newsResults, setNewsResults] = useState<NewsItem[]>([]);
  const [dartResults, setDartResults] = useState<DartItem[]>([]);
  const [aiResults, setAiResults] = useState<AIEvaluation[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [isDartChecking, setIsDartChecking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // 선택된 AI 결과 변경 시 상위로 전달
  useEffect(() => {
    const selectedStockData: SelectedStock[] = aiResults
      .filter((result) => result.selected)
      .map((result) => ({
        id: result.code,
        symbol: result.code,
        name: result.company,
        price: 0, // 뉴스 스캘핑에서는 가격 정보가 없으므로 0
        strategy: 'Newsfeed Scalping',
        metadata: {
          newsTitle: result.newsTitle,
          dartInfo: result.dartInfo,
          evaluation: result.evaluation,
        },
      }));

    if (onSelectedStocksChange) {
      onSelectedStocksChange(selectedStockData);
    }
  }, [aiResults]);

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
    // 뉴스나 Dart 결과 중 하나라도 선택되어 있으면 평가 진행
    const selectedNews = newsResults.filter((news) => news.selected);
    const selectedDart = dartResults.filter((dart) => dart.selected);

    if (selectedNews.length === 0 && selectedDart.length === 0) {
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
          selected: false,
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
          selected: false,
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

  // 초기화 함수
  const handleReset = () => {
    setTimeRange(0);
    setSelectedKeywords([]);
    setNewKeyword('');
    setNewsResults([]);
    setDartResults([]);
    setAiResults([]);
    setIsSearching(false);
    setIsDartChecking(false);
    setIsEvaluating(false);
  };

  const hasNewsResults = newsResults.length > 0;
  const hasSelectedNews = newsResults.some((news) => news.selected);

  return (
    <Card className="min-h-[200px] border-none bg-transparent">
      <CardContent className="space-y-4 lg:space-y-6 px-4 lg:px-6 py-0">
        <p className="text-muted-foreground text-sm">
          최근 뉴스를 키워드로 필터링하여 공시정보를 확인하고 AI 투자 판단을
          통해 스캘핑 후보 종목을 선별합니다.
        </p>

        {/* 검색 설정 */}
        <FilteringSection
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedKeywords={selectedKeywords}
          setSelectedKeywords={setSelectedKeywords}
          customKeywords={customKeywords}
          setCustomKeywords={setCustomKeywords}
          newKeyword={newKeyword}
          setNewKeyword={setNewKeyword}
          isSearching={isSearching}
          isDartChecking={isDartChecking}
          isEvaluating={isEvaluating}
          hasSelectedNews={hasSelectedNews}
          onSearchNews={searchNews}
          onCheckDart={checkDart}
          onEvaluateWithAI={evaluateWithAI}
          onReset={handleReset}
        />

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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
