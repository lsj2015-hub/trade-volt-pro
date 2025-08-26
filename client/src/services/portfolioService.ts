import { TransactionAPI } from '@/lib/transaction-api';
import { StockAPI } from '@/lib/stock-api';
import { ExchangeAPI } from '@/lib/exchange-api';
import {
  StockData,
  PortfolioHoldingResponse,
  StockPriceResponse,
  ExchangeRateResponse,
} from '@/types/types';

export class PortfolioServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'PortfolioServiceError';
  }
}

export class PortfolioService {
  /**
   * 포트폴리오 데이터와 현재가를 조합하여 StockData 배열 반환
   */
  static async getPortfolioWithPrices(): Promise<{
    domesticStocks: StockData[];
    overseasStocks: StockData[];
    exchangeRate: number
  }> {
    try {
      // 1. 포트폴리오 요약 조회 및 환율 조회 (병렬 처리)
      const [portfolioSummary, exchangeRateData] = await Promise.all([
        TransactionAPI.getPortfolioSummary(),
        ExchangeAPI.getUsdKrwRate(),
      ]);

      const exchangeRate = exchangeRateData.exchange_rate;

      if (
        !portfolioSummary.holdings ||
        portfolioSummary.holdings.length === 0
      ) {
        return { domesticStocks: [], overseasStocks: [], exchangeRate };
      }

      // 2. 각 종목별 현재가 조회 (병렬 처리)
      const pricePromises = portfolioSummary.holdings.map(async (holding) => {
        try {
          const marketType = holding.market_type as 'DOMESTIC' | 'OVERSEAS';
          const priceData = await StockAPI.getStockPrice(
            holding.stock_symbol,
            marketType
          );
          return { holding, priceData };
        } catch (error) {
          console.warn(`종목 ${holding.stock_symbol} 현재가 조회 실패:`, error);
          // 현재가 조회 실패 시 기본값 사용
          return {
            holding,
            priceData: this.createFallbackPriceData(holding),
          };
        }
      });

      const holdingsWithPrices = await Promise.all(pricePromises);

      // 3. StockData로 변환 및 국내/해외 분류
      const domesticStocks: StockData[] = [];
      const overseasStocks: StockData[] = [];

      holdingsWithPrices.forEach(({ holding, priceData }) => {
        const stockData = this.transformToStockData(holding, priceData);

        if (holding.market_type === 'DOMESTIC') {
          domesticStocks.push(stockData);
        } else {
          overseasStocks.push(stockData);
        }
      });

      return { domesticStocks, overseasStocks, exchangeRate };
    } catch (error) {
      console.error('포트폴리오 데이터 조회 실패:', error);
      // 에러 발생 시 기본값 반환
      return {
        domesticStocks: [],
        overseasStocks: [],
        exchangeRate: 1400,
      };
    }
  }

  /**
   * PortfolioHoldingResponse + StockPriceResponse를 StockData로 변환
   */
  private static transformToStockData(
    holding: PortfolioHoldingResponse,
    priceData: StockPriceResponse
  ): StockData {
    const shares = holding.total_quantity;
    const avgCost = holding.average_cost_price;
    const currentPrice = priceData.current_price;
    const marketValue = shares * currentPrice;

    // 총 투자금액 (매입가 * 수량)
    const totalCost = shares * avgCost;

    // 총 손익 = 현재 시장가치 - 총 투자금액
    const totalGain = marketValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // 일일 손익 = 수량 * 일일 변화금액
    const dayGain = shares * priceData.day_change;
    const dayGainPercent = priceData.daily_return_rate;

    return {
      symbol: holding.stock_symbol,
      companyName: holding.company_name,
      shares,
      avgCost,
      currentPrice,
      marketValue,
      dayGain,
      dayGainPercent,
      totalGain,
      totalGainPercent,
    };
  }

  /**
   * 현재가 조회 실패 시 사용할 기본 가격 데이터 생성
   */
  private static createFallbackPriceData(
    holding: PortfolioHoldingResponse
  ): StockPriceResponse {
    const fallbackPrice = holding.average_cost_price; // 평균 매입가를 현재가로 사용

    return {
      symbol: holding.stock_symbol,
      market_type: holding.market_type,
      current_price: fallbackPrice,
      previous_close: fallbackPrice,
      daily_return_rate: 0,
      day_change: 0,
      volume: 0,
      high_price: fallbackPrice,
      low_price: fallbackPrice,
      open_price: fallbackPrice,
      currency: holding.currency,
      updated_at: new Date().toISOString(),
    };
  }
}
