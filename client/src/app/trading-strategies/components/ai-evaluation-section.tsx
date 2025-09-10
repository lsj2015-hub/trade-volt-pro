'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

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

interface AIEvaluationSectionProps {
  aiResults: AIEvaluation[];
  onToggleSelection: (company: string) => void;
}

export const AIEvaluationSection = ({
  aiResults,
  onToggleSelection,
}: AIEvaluationSectionProps) => {
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
                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h5 className="font-semibold text-blue-900 text-sm md:text-base">
                        단기 모멘텀 잠재력
                      </h5>
                      <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-xs self-start sm:self-auto">
                        {result.evaluation.단기_모멘텀_잠재력.점수}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-blue-800">
                      {result.evaluation.단기_모멘텀_잠재력.이유}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 md:p-4 rounded-lg border border-yellow-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h5 className="font-semibold text-yellow-900 text-sm md:text-base">
                        유동성_및_거래량_예상
                      </h5>
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-xs self-start sm:self-auto">
                        {result.evaluation.유동성_및_거래량_예상.점수}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-yellow-800">
                      {result.evaluation.유동성_및_거래량_예상.이유}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 md:p-4 rounded-lg border border-red-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h5 className="font-semibold text-red-900 text-sm md:text-base">
                        리스크_요인
                      </h5>
                    </div>
                    <p className="text-xs md:text-sm text-red-800">
                      {result.evaluation.리스크_요인.이유}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h5 className="font-semibold text-green-900 text-sm md:text-base">
                        최종_스캘핑_적합성_판단
                      </h5>
                      <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs self-start sm:self-auto">
                        {result.evaluation.최종_스캘핑_적합성_판단.점수}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-green-800">
                      {result.evaluation.최종_스캘핑_적합성_판단.요약}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
