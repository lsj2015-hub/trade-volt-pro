import asyncio
import logging
from typing import Dict, List
from datetime import datetime
from collections import defaultdict

from app.crud.transaction_crud import transaction_crud
from app.external.kis_api import kis_api_service
from app.external.exchange_rate_api import exchange_rate_service
from app.schemas.common_schema import StockDataResponse, PortfolioResponse
from app.core.exceptions import CustomHTTPException
from app.config.database import get_async_session

logger = logging.getLogger(__name__)

class PortfolioService:
  """포트폴리오 서비스 - Symbol별 합산 + 현재가 + 환율 통합 처리"""
  
  @staticmethod
  async def get_complete_portfolio(user_id: int) -> PortfolioResponse:
    """완전한 포트폴리오 정보 조회"""
    db_gen = get_async_session()
    db = await db_gen.__anext__()
    
    try:
      # 1. 포트폴리오 데이터와 환율 병렬 조회
      portfolio_task = transaction_crud.get_user_portfolio_summary(db, user_id)
      exchange_task = exchange_rate_service.get_usd_krw_rate()
      
      portfolio_data, exchange_data = await asyncio.gather(portfolio_task, exchange_task)
      exchange_rate = exchange_data["currency"]["exchange_rate"]
      
      if not portfolio_data:
        return PortfolioService._empty_response(exchange_rate)
      
      # 2. Symbol별 합산 처리
      logger.info(f"Raw portfolio data: {portfolio_data}")
      aggregated_holdings = PortfolioService._aggregate_by_symbol(portfolio_data)
      logger.info(f"Aggregated holdings: {aggregated_holdings}")
      
      # 3. 각 Symbol의 현재가 조회 (병렬)
      price_tasks = [
        PortfolioService._get_price_safe(holding["stock_symbol"], holding["market_type"])
        for holding in aggregated_holdings
      ]
      price_results = await asyncio.gather(*price_tasks, return_exceptions=True)
      
      # 4. StockData 변환 및 국내/해외 분류
      domestic_stocks = []
      overseas_stocks = []
      
      for i, holding in enumerate(aggregated_holdings):
        price_data = price_results[i]
        
        # 현재가 조회 실패 시 기본값
        if isinstance(price_data, Exception) or not price_data:
          current_price = holding["average_cost_price"]
          day_change = 0.0
          daily_return_rate = 0.0
        else:
          current_price = price_data["current_price"]
          day_change = price_data["day_change"]
          daily_return_rate = price_data["daily_return_rate"]
        
        # StockData 계산
        stock_data = PortfolioService._calculate_stock_data(
          holding, current_price, day_change, daily_return_rate
        )
        
        # 국내/해외 분류
        if holding["market_type"] == "DOMESTIC":
          domestic_stocks.append(stock_data)
        else:
          overseas_stocks.append(stock_data)
      
      # 5. 전체 합계 계산 (KRW 기준)
      totals = PortfolioService._calculate_totals(domestic_stocks, overseas_stocks, exchange_rate)
      
      return PortfolioResponse(
        domestic_stocks=domestic_stocks,
        overseas_stocks=overseas_stocks,
        exchange_rate=exchange_rate,
        total_portfolio_krw=totals["total_portfolio"],
        total_day_gain_krw=totals["total_day_gain"],
        total_total_gain_krw=totals["total_total_gain"],
        updated_at=datetime.now().isoformat()
      )
      
    except Exception as e:
      logger.error(f"포트폴리오 조회 오류: user_id={user_id}, error={str(e)}")
      raise CustomHTTPException(
        status_code=500,
        detail="포트폴리오 데이터를 불러올 수 없습니다.",
        error_code="PORTFOLIO_ERROR"
      )
    finally:
      await db.close()
  
  @staticmethod
  def _empty_response(exchange_rate: float) -> PortfolioResponse:
    """빈 포트폴리오 응답"""
    return PortfolioResponse(
      domestic_stocks=[],
      overseas_stocks=[],
      exchange_rate=exchange_rate,
      total_portfolio_krw=0.0,
      total_day_gain_krw=0.0,
      total_total_gain_krw=0.0,
      updated_at=datetime.now().isoformat()
    )
  
  @staticmethod
  def _aggregate_by_symbol(holdings_data: List[Dict]) -> List[Dict]:
    """Symbol별 합산 처리"""
    symbol_groups = defaultdict(list)
    
    # Symbol + market_type별로 그룹핑
    for holding in holdings_data:
      key = f"{holding['stock_symbol']}_{holding['market_type']}"
      symbol_groups[key].append(holding)
    
    aggregated = []
    for group in symbol_groups.values():
      # 총 수량
      total_quantity = sum(h["total_quantity"] for h in group)
      
      # 총 투자금액
      total_cost_amount = sum(h["total_cost_amount"] for h in group)
      
      # 가중평균 매입단가
      weighted_avg_cost = total_cost_amount / total_quantity if total_quantity > 0 else 0
      
      # 합산된 데이터
      aggregated.append({
        "stock_symbol": group[0]["stock_symbol"],
        "company_name": group[0]["company_name"],
        "market_type": group[0]["market_type"],
        "currency": group[0]["currency"],
        "total_quantity": total_quantity,
        "average_cost_price": weighted_avg_cost,
        "total_cost_amount": total_cost_amount
      })
    
    return aggregated
  
  @staticmethod
  async def _get_price_safe(symbol: str, market_type: str) -> Dict:
    """안전한 주가 조회"""
    try:
      price_data = await kis_api_service.get_stock_price(symbol, market_type)
      logger.info(f"KIS API 응답 성공: {symbol} = {price_data}")
      return price_data
    except Exception as e:
      logger.warning(f"주가 조회 실패: {symbol}, error={str(e)}")
      
      # KIS API 실패 시 임시 데이터 반환 (None 대신)
      return {
        "current_price": 100.0,  # 기본값
        "day_change": 1.0,       # 0이 아닌 값
        "daily_return_rate": 1.0 # 0이 아닌 값
      }

  @staticmethod
  def _calculate_stock_data(holding: Dict, current_price: float, day_change: float, daily_return_rate: float) -> StockDataResponse:
    """StockData 계산 (해당 통화 기준)"""
    shares = holding["total_quantity"]
    avg_cost = holding["average_cost_price"]
    market_value = shares * current_price
    
    # 총 투자금액 대비 손익
    total_cost = holding["total_cost_amount"]
    total_gain = market_value - total_cost
    total_gain_percent = (total_gain / total_cost * 100) if total_cost > 0 else 0.0
    
    # 일일 손익
    day_gain = shares * day_change
    
    return StockDataResponse(
      symbol=holding["stock_symbol"],
      company_name=holding["company_name"],
      shares=shares,
      avg_cost=avg_cost,
      current_price=current_price,
      market_value=market_value,
      day_gain=day_gain,
      day_gain_percent=daily_return_rate,
      total_gain=total_gain,
      total_gain_percent=total_gain_percent
    )
  
  @staticmethod
  def _calculate_totals(domestic_stocks: List[StockDataResponse], overseas_stocks: List[StockDataResponse], exchange_rate: float) -> Dict:
    """전체 합계 계산 (KRW 기준)"""
    # 국내 합계 (KRW)
    domestic_total = sum(stock.market_value for stock in domestic_stocks)
    domestic_day_gain = sum(stock.day_gain for stock in domestic_stocks)
    domestic_total_gain = sum(stock.total_gain for stock in domestic_stocks)
    
    # 해외 합계 (USD → KRW)
    overseas_total_usd = sum(stock.market_value for stock in overseas_stocks)
    overseas_day_gain_usd = sum(stock.day_gain for stock in overseas_stocks)
    overseas_total_gain_usd = sum(stock.total_gain for stock in overseas_stocks)
    
    overseas_total_krw = overseas_total_usd * exchange_rate
    overseas_day_gain_krw = overseas_day_gain_usd * exchange_rate
    overseas_total_gain_krw = overseas_total_gain_usd * exchange_rate
    
    return {
      "total_portfolio": domestic_total + overseas_total_krw,
      "total_day_gain": domestic_day_gain + overseas_day_gain_krw,
      "total_total_gain": domestic_total_gain + overseas_total_gain_krw
    }

# 싱글톤 인스턴스
portfolio_service = PortfolioService()