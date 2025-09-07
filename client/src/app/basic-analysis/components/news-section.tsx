'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Rss } from 'lucide-react';
import { StockInfo, NewsResponse, NewsTranslateResponse } from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';
import { getDefaultDates } from '@/lib/utils';

interface NewsSectionProps {
  selectedStock: StockInfo | null;
  onDataUpdate?: (data: NewsResponse | null, show: boolean) => void;
}

export const NewsSection = ({ selectedStock, onDataUpdate }: NewsSectionProps) => {
  const [newsStartDate, setNewsStartDate] = useState<Date | undefined>(
    getDefaultDates().sevenDaysAgo
  );
  const [newsEndDate, setNewsEndDate] = useState<Date | undefined>(
    getDefaultDates().today
  );
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNews, setShowNews] = useState(false);

  // 번역 관련 상태 추가
  const [translatingNews, setTranslatingNews] = useState<{
    [key: number]: boolean;
  }>({});

  // 뉴스 조회/숨기기 함수
  const handleNewsToggle = async () => {
    if (showNews) {
      // 뉴스 숨기기
      setShowNews(false);
      onDataUpdate?.(newsData, false);
      return;
    }

    // 뉴스 조회
    if (!selectedStock || !newsStartDate || !newsEndDate) {
      return;
    }

    setNewsLoading(true);

    try {
      const startDateStr = newsStartDate.toISOString().split('T')[0];
      const endDateStr = newsEndDate.toISOString().split('T')[0];

      const result = await AnalysisAPI.getStockNews(
        selectedStock.symbol,
        startDateStr,
        endDateStr,
        selectedStock.exchange_code,
        50
      );

      setNewsData(result);
      setShowNews(true);
      onDataUpdate?.(result, true);
    } catch (error) {
      console.error('뉴스 조회 오류:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // 뉴스 번역 함수
  const handleTranslateNews = async (newsIndex: number) => {
    if (!newsData || newsIndex >= newsData.data.length) return;

    const newsItem = newsData.data[newsIndex];

    // 이미 번역된 경우 원문/번역 토글
    if (newsItem.is_translated) {
      const updatedNews = { ...newsData };
      updatedNews.data[newsIndex] = {
        ...newsItem,
        is_translated: false, // 원문으로 돌리기
      };
      setNewsData(updatedNews);
      return;
    }

    // 번역 시작
    setTranslatingNews((prev) => ({ ...prev, [newsIndex]: true }));

    try {
      const result: NewsTranslateResponse = await AnalysisAPI.translateNews(
        newsItem.title,
        newsItem.summary || '',
        'ko'
      );

      if (result.success) {
        // 번역 결과로 뉴스 데이터 업데이트
        const updatedNews = { ...newsData };
        updatedNews.data[newsIndex] = {
          ...newsItem,
          translated_title: result.translated.title,
          translated_summary: result.translated.summary,
          is_translated: true,
        };
        setNewsData(updatedNews);
      }
    } catch (error) {
      console.error('뉴스 번역 오류:', error);
      // 에러 처리 (필요시 toast 알림)
    } finally {
      setTranslatingNews((prev) => ({ ...prev, [newsIndex]: false }));
    }
  };

  // 뉴스 렌더링 함수 (번역 기능 포함)
  const renderNews = () => {
    if (!newsData) return null;

    if (newsData.news_count === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📰</div>
          <p className="text-muted-foreground">해당 기간에 뉴스가 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">
            다른 기간을 선택해보세요.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            최신 뉴스 ({newsData.news_count}건)
          </h3>
          <div className="text-sm text-muted-foreground">
            {newsData.start_date} ~ {newsData.end_date}
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {newsData.data.map((news, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-5 line-clamp-2 flex-1">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {news.is_translated && news.translated_title
                        ? news.translated_title
                        : news.title}
                    </a>
                  </h4>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslateNews(index)}
                    disabled={translatingNews[index]}
                    className="text-xs px-2 py-1 h-6 shrink-0"
                  >
                    {translatingNews[index] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : news.is_translated ? (
                      '원문'
                    ) : (
                      '번역'
                    )}
                  </Button>
                </div>

                {(news.summary || news.translated_summary) && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {news.is_translated && news.translated_summary
                      ? news.translated_summary
                      : news.summary}
                  </p>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{news.source}</span>
                    {news.is_translated && (
                      <span className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-xs">
                        번역됨
                      </span>
                    )}
                  </div>
                  {news.publishedDate && (
                    <span>
                      {new Date(news.publishedDate).toLocaleDateString(
                        'ko-KR',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rss className="h-5 w-5" />
          뉴스
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedStock ? (
          <div className="text-center py-2">
            <div className="text-4xl mb-4">📰</div>
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
                    date={newsStartDate}
                    onSelect={setNewsStartDate}
                    className="text-center justify-center"
                  />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-1 block">
                    종료일
                  </label>
                  <DatePicker
                    date={newsEndDate}
                    onSelect={setNewsEndDate}
                    className="text-center justify-center"
                  />
                </div>
              </div>
              <Button
                onClick={handleNewsToggle}
                disabled={newsLoading || !newsStartDate || !newsEndDate}
                variant="basic"
                className="w-[150px]"
              >
                {newsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {showNews ? '뉴스 숨기기' : '뉴스 조회'}
              </Button>
            </div>

            {/* 뉴스 데이터 표시 */}
            {showNews && renderNews()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
