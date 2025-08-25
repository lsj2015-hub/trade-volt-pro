'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, Calendar, MessageSquare, Sheet, Rss } from 'lucide-react';

export default function BasicAnalysisPage() {
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedInfo, setSelectedInfo] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl md:text-3xl font-bold">Basic Analysis</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          종목의 기본 정보, 재무제표, 주가 히스토리를 분석하고 AI에게
          질문해보세요.
        </p>
      </div>

      {/* 기본정보 조회 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Search className="h-5 w-5" />
            종목검색 및 정보조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <Input
                placeholder="종목명 또는 티커 입력 (예: AAPL)"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="md:col-span-4">
              <Select value={selectedInfo} onValueChange={setSelectedInfo}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="정보 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company-summary">
                    Company Summary
                  </SelectItem>
                  <SelectItem value="financial-summary">
                    Financial Summary
                  </SelectItem>
                  <SelectItem value="investment-index">
                    Investment Index
                  </SelectItem>
                  <SelectItem value="market-info">Market Info</SelectItem>
                  <SelectItem value="analyst-opinion">
                    Analyst Opinion
                  </SelectItem>
                  <SelectItem value="major-executors">
                    Major Executors
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button className="bg-slate-700 hover:bg-slate-600 text-white w-full h-11">
                조회
              </Button>
            </div>
          </div>

          {/* 조회 결과 표시 영역 */}
          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              종목을 검색하고 정보 유형을 선택하여 조회해보세요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 재무제표 상세 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sheet className="h-5 w-5" />
            재무제표 상세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income">손익계산서</TabsTrigger>
              <TabsTrigger value="balance">대차대조표</TabsTrigger>
              <TabsTrigger value="cashflow">현금흐름표</TabsTrigger>
            </TabsList>
            <TabsContent value="income" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="balance" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="cashflow" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 기간별 주가 히스토리 조회 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5" />
            기간별 주가 히스토리 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="2025년 08월 16일"
                  className="h-11"
                />
              </div>
            </div>
            <div className="md:col-span-1 text-center flex items-center justify-center h-11">
              <span className="text-muted-foreground text-lg">~</span>
            </div>
            <div className="md:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="2025년 08월 23일"
                  className="h-11"
                />
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-11">
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button variant="basic" className="w-full h-11">
                  주가 데이터 조회
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              조회 기간을 선택하고 '주가 데이터 조회' 버튼을 클릭하여 히스토리를
              확인하세요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 관련 최신 뉴스 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Rss className="w-5 h-5" />
            관련 최신 뉴스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              종목 관련 최신 뉴스가 여기에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* David에게 자유롭게 질문하세요 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquare className="h-5 w-5" />
            David에게 자유롭게 질문하세요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 min-h-[150px] bg-muted/20 flex flex-col items-center justify-center">
              <div className="text-4xl mb-4">💡</div>
              <p className="text-center font-medium">질문 예시:</p>
              <p className="text-center text-muted-foreground text-sm">
                "이 기업의 최신 뉴스를 분석하여, 긍정적/부정적 요소를 정리해줘."
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="David에게 궁금한 점을 입력하세요 (Shift+Enter로 줄바꿈)"
                className="flex-1"
              />
              <Button variant="basic">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
