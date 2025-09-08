'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  StockInfo,
  NewsResponse,
  PriceHistoryResponse,
  AnalysisData,
} from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';

interface DavidAIChatSectionProps {
  selectedStock: StockInfo | null;
  analysisData?: AnalysisData | null;
  financialData?: { [key: string]: any } | null;
  activeFinancialTab?: 'income' | 'balance' | 'cashflow';
  priceHistoryData?: PriceHistoryResponse | null;
  showPriceHistory?: boolean;
  newsData?: NewsResponse | null;
  showNews?: boolean;
}

export const DavidAIChatSection = ({
  selectedStock,
  analysisData,
  financialData,
  activeFinancialTab = 'income',
  priceHistoryData,
  showPriceHistory,
  newsData,
  showNews,
}: DavidAIChatSectionProps) => {
  // David AI 관련 상태
  const [davidQuestion, setDavidQuestion] = useState<string>('');
  const [davidLoading, setDavidLoading] = useState<boolean>(false);
  const [davidError, setDavidError] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showDavidChat, setShowDavidChat] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current && conversationHistory.length > 0) {
      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      };

      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(scrollToBottom, 50);
    }
  }, [conversationHistory, davidLoading]);

  // 종목 변경 시 대화 초기화 (selectedStock 자체를 감지)
  useEffect(() => {
    // selectedStock이 변경되면 (선택되거나 null이 되거나) 대화 내용 초기화
    setConversationHistory([]);
    setShowDavidChat(false);
    setDavidError('');
    setDavidQuestion('');
  }, [selectedStock]); // selectedStock 전체를 감지

  // 회사 분석 정보를 AI용으로 포매팅하는 함수 (4가지 유형만)
  const formatCompanyDataForAI = (): string => {
    let result = '';

    // 상세 분석 데이터 - 4가지 유형만 포함
    if (analysisData) {
      const data = analysisData as any;

      // Financial Summary 데이터
      if (
        data.totalRevenue ||
        data.netIncomeToCommon ||
        data.operatingMargins
      ) {
        result += `=== 재무 요약 (Financial Summary) ===\n`;
        result += `총 매출: ${data.totalRevenue || 'N/A'}\n`;
        result += `순이익: ${data.netIncomeToCommon || 'N/A'}\n`;
        result += `영업이익률: ${data.operatingMargins || 'N/A'}\n`;
        result += `배당수익률: ${data.dividendYield || 'N/A'}\n`;
        result += `EPS: ${data.trailingEps || 'N/A'}\n`;
        result += `총 현금: ${data.totalCash || 'N/A'}\n\n`;
      }

      // Investment Index 데이터
      if (data.trailingPE || data.priceToBook || data.returnOnEquity) {
        result += `=== 투자 지표 (Investment Index) ===\n`;
        result += `PER: ${data.trailingPE || 'N/A'}\n`;
        result += `PBR: ${data.priceToBook || 'N/A'}\n`;
        result += `ROE: ${data.returnOnEquity || 'N/A'}\n`;
        result += `ROA: ${data.returnOnAssets || 'N/A'}\n`;
        result += `베타: ${data.beta || 'N/A'}\n\n`;
      }

      // Market Info 데이터
      if (data.currentPrice || data.marketCap || data.volume) {
        result += `=== 시장 정보 (Market Info) ===\n`;
        result += `현재가: ${data.currentPrice || 'N/A'}\n`;
        result += `전일종가: ${data.previousClose || 'N/A'}\n`;
        result += `시가총액: ${data.marketCap || 'N/A'}\n`;
        result += `거래량: ${data.volume || 'N/A'}\n`;
        result += `52주 최고가: ${data.fiftyTwoWeekHigh || 'N/A'}\n`;
        result += `52주 최저가: ${data.fiftyTwoWeekLow || 'N/A'}\n\n`;
      }

      // Analyst Opinion 데이터
      if (
        data.recommendationKey ||
        data.numberOfAnalystOpinions ||
        data.targetMeanPrice
      ) {
        result += `=== 애널리스트 의견 (Analyst Opinion) ===\n`;
        result += `추천 등급: ${data.recommendationKey || 'N/A'}\n`;
        result += `분석가 수: ${data.numberOfAnalystOpinions || 0}명\n`;
        result += `목표가 (평균): ${data.targetMeanPrice || 'N/A'}\n`;
        result += `목표가 (최고): ${data.targetHighPrice || 'N/A'}\n`;
        result += `목표가 (최저): ${data.targetLowPrice || 'N/A'}\n\n`;
      }
    }

    return result;
  };

  // 재무제표 데이터를 AI용으로 포매팅하는 함수
  const formatFinancialDataForAI = (): string => {
    if (
      !financialData ||
      !financialData.data ||
      !Array.isArray(financialData.data) ||
      financialData.data.length === 0
    ) {
      return '';
    }

    let result = `=== 재무제표 정보 ===\n`;
    result += `재무제표 유형: ${
      activeFinancialTab === 'income'
        ? '손익계산서'
        : activeFinancialTab === 'balance'
        ? '대차대조표'
        : '현금흐름표'
    }\n`;

    // financialData.years가 배열인 경우에만 처리
    if (financialData.years && Array.isArray(financialData.years)) {
      result += `연도: ${financialData.years.join(', ')}\n\n`;

      // 주요 항목들만 선별해서 포함
      financialData.data.forEach((item: any) => {
        if (item && typeof item === 'object' && 'item' in item) {
          result += `${item.item}: `;
          financialData.years.forEach((year: string) => {
            const value = item[year] || '-';
            result += `${year}년 ${value}, `;
          });
          result += '\n';
        }
      });
    }

    return result;
  };

  // 주가 데이터를 AI용으로 포매팅하는 함수
  const formatPriceDataForAI = (): string => {
    if (!priceHistoryData || !showPriceHistory) return '';
    const recentData = priceHistoryData.data.slice(-10);
    let result = `최근 주가 동향 (${priceHistoryData.start_date} ~ ${priceHistoryData.end_date}):\n`;
    recentData.forEach((item) => {
      result += `${item.date}: 시가 $${item.open}, 고가 $${item.high}, 저가 $${
        item.low
      }, 종가 $${item.close}, 거래량 ${item.volume.toLocaleString()}\n`;
    });
    return result;
  };

  // 뉴스 데이터를 AI용으로 포매팅하는 함수
  const formatNewsDataForAI = (): string => {
    if (!newsData || !showNews) return '';
    let result = `최신 뉴스 (총 ${newsData.news_count}건):\n`;
    newsData.data.slice(0, 5).forEach((news, index) => {
      result += `${index + 1}. ${news.title}\n`;
      if (news.summary) result += `   요약: ${news.summary.slice(0, 100)}...\n`;
    });
    return result;
  };

  // David AI 질문 함수
  const handleDavidQuestion = async () => {
    if (!selectedStock || !davidQuestion.trim()) {
      setDavidError('종목을 선택하고 질문을 입력해주세요.');
      return;
    }

    setDavidLoading(true);
    setDavidError('');

    setShowDavidChat(true);
    const currentQuestion = davidQuestion;
    setDavidQuestion('');

    try {
      const result = await AnalysisAPI.askDavidQuestion(
        selectedStock.symbol,
        currentQuestion,
        conversationHistory,
        formatCompanyDataForAI(),
        formatFinancialDataForAI(),
        formatPriceDataForAI(),
        formatNewsDataForAI()
      );

      if (result.success) {
        setConversationHistory(result.conversation_history);
      } else {
        setDavidError('질문 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('David AI 질문 오류:', error);
      setDavidError('David AI 질문 중 오류가 발생했습니다.');
    } finally {
      setDavidLoading(false);
    }
  };

  // Enter 키 처리 함수
  const handleDavidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDavidQuestion();
    }
  };

  // 대화 초기화 함수
  const handleClearChat = () => {
    setConversationHistory([]);
    setShowDavidChat(false);
    setDavidError('');
    setDavidQuestion('');
  };

  return (
    <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            David에게 자유롭게 질문하세요
            {selectedStock && (
              <span className="text-sm text-muted-foreground font-normal">
                ({selectedStock.symbol})
              </span>
            )}
          </div>
          {showDavidChat && conversationHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs"
            >
              대화 초기화
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 대화 내용 표시 영역 */}
          <div
            ref={chatContainerRef}
            className="border rounded-lg p-4 min-h-[200px] max-h-[400px] bg-muted/20 overflow-y-auto scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {showDavidChat && conversationHistory.length > 0 ? (
              <div className="space-y-4">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div
                            className={`text-sm whitespace-pre-wrap ${
                              message.role === 'user'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {message.content}
                          </div>
                          <div
                            className={`text-xs mt-1 opacity-70 ${
                              message.role === 'user'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString(
                              'ko-KR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 로딩 중일 때 표시 */}
                {davidLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          David가 분석 중입니다...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-4xl mb-4">💡</div>
                <p className="text-center font-medium mb-2">질문 예시:</p>
                <div className="text-center text-muted-foreground text-sm space-y-1">
                  <p>"이 기업의 재무상태는 어떤가요?"</p>
                  <p>"최근 주가 흐름을 분석해주세요."</p>
                  <p>"최신 뉴스가 주가에 미칠 영향은?"</p>
                </div>
                {!selectedStock && (
                  <p className="text-red-500 text-xs mt-4">
                    ※ 먼저 상단에서 종목을 선택해주세요
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 오류 메시지 */}
          {davidError && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
              ⚠️ {davidError}
            </div>
          )}

          {/* 질문 입력 영역 */}
          <div className="flex gap-2">
            <Input
              placeholder={
                selectedStock
                  ? 'David에게 궁금한 점을 입력하세요 (Enter로 전송)'
                  : '먼저 종목을 선택해주세요'
              }
              value={davidQuestion}
              onChange={(e) => setDavidQuestion(e.target.value)}
              onKeyDown={handleDavidKeyDown}
              disabled={!selectedStock || davidLoading}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleDavidQuestion}
              disabled={!selectedStock || !davidQuestion.trim() || davidLoading}
            >
              {davidLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
