'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';

interface DartItem {
  id: string;
  company: string;
  dartLink: string;
  dartTitle: string;
  newsTitle: string;
  publishTime: string;
  selected?: boolean;
}

interface DartResultsSectionProps {
  dartResults: DartItem[];
  onToggleSelection: (dartId: string) => void;
  onToggleAllSelection: () => void;
}

export const DartResultsSection = ({
  dartResults,
  onToggleSelection,
  onToggleAllSelection,
}: DartResultsSectionProps) => {
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
