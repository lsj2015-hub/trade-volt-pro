'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Rss } from 'lucide-react';

interface NewsItem {
  id: string;
  company: string;
  title: string;
  summary: string;
  link: string;
  publishTime: string;
  selected?: boolean;
}

interface NewsResultsSectionProps {
  newsResults: NewsItem[];
  onToggleSelection: (newsId: string) => void;
  onToggleAllSelection: () => void;
}

export const NewsResultsSection = ({
  newsResults,
  onToggleSelection,
  onToggleAllSelection,
}: NewsResultsSectionProps) => {
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
