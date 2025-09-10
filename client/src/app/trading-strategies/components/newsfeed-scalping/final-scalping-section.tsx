'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

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

interface FinalScalpingSectionProps {
  aiResults: AIEvaluation[];
}

export const FinalScalpingSection = ({ aiResults }: FinalScalpingSectionProps) => {
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
