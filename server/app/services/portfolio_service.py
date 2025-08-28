import asyncio
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict

from app.crud.transaction_crud import transaction_crud
from app.external.kis_api import kis_api_service
from app.external.exchange_rate_api import exchange_rate_service
from app.schemas.common_schema import StockDataResponse, CompletePortfolioResponse, PortfolioSummaryData
from app.core.exceptions import CustomHTTPException
from app.config.database import get_async_session

logger = logging.getLogger(__name__)

class PortfolioService:
  """포트폴리오 서비스 - Symbol별 합산 + 현재가 + 환율 통합 처리"""
  
  @staticmethod
  async def get_complete_portfolio(user_id: int) -> CompletePortfolioResponse:
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
        PortfolioService._get_price_safe(user_id, holding["stock_symbol"], holding["market_type"])
        for holding in aggregated_holdings
      ]
      price_results = await asyncio.gather(*price_tasks, return_exceptions=True)
      
      # 4. StockData 변환 및 국내/해외 분류
      domestic_stocks = []
      overseas_stocks = []
      
      for i, holding in enumerate(aggregated_holdings):
        price_data = price_results[i]
        
        # API 조회 실패한 종목은 건너뛰기
        if isinstance(price_data, Exception) or price_data is None:
          logger.warning(f"종목 {holding['stock_symbol']} 가격 조회 실패, 포트폴리오에서 제외")
          continue
        
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
      
      # 6. 국내/해외 요약 데이터 계산
      domestic_summary = PortfolioService._calculate_domestic_summary(domestic_stocks)
      overseas_summary = PortfolioService._calculate_overseas_summary(overseas_stocks)
      
      # 7. 전체 수익률 계산
      total_cost_krw = sum(stock.avg_cost * stock.shares for stock in domestic_stocks) + \
                       sum(stock.avg_cost * stock.shares for stock in overseas_stocks) * exchange_rate
      total_gain_percent = (totals["total_total_gain"] / total_cost_krw * 100) if total_cost_krw > 0 else 0.0
      total_day_gain_percent = (totals["total_day_gain"] / totals["total_portfolio"] * 100) if totals["total_portfolio"] > 0 else 0.0
      
      return CompletePortfolioResponse(
        # 전체 포트폴리오 카드
        total_portfolio_value_krw=totals["total_portfolio"],
        total_day_gain_krw=totals["total_day_gain"],
        total_day_gain_percent=total_day_gain_percent,
        total_total_gain_krw=totals["total_total_gain"],
        total_total_gain_percent=total_gain_percent,
        
        # 요약 카드
        domestic_summary=domestic_summary,
        overseas_summary=overseas_summary,
        
        # 테이블 데이터
        domestic_stocks=domestic_stocks,
        overseas_stocks=overseas_stocks,
        
        # 메타 데이터
        exchange_rate=exchange_rate,
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
  def _empty_response(exchange_rate: float) -> CompletePortfolioResponse:
    """빈 포트폴리오 응답"""
    return CompletePortfolioResponse(
      # 전체 포트폴리오 카드
      total_portfolio_value_krw=0.0,
      total_day_gain_krw=0.0,
      total_day_gain_percent=0.0,
      total_total_gain_krw=0.0,
      total_total_gain_percent=0.0,
      
      # 요약 카드
      domestic_summary=PortfolioSummaryData(
        market_value=0.0,
        day_gain=0.0,
        day_gain_percent=0.0,
        total_gain=0.0,
        total_gain_percent=0.0
      ),
      overseas_summary=PortfolioSummaryData(
        market_value=0.0,
        day_gain=0.0,
        day_gain_percent=0.0,
        total_gain=0.0,
        total_gain_percent=0.0
      ),
      
      # 테이블 데이터
      domestic_stocks=[],
      overseas_stocks=[],
      
      # 메타 데이터
      exchange_rate=exchange_rate,
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
      total_quantity = sum(h["total_quantity"] for h in group)
      total_cost_amount = sum(h["total_cost_amount"] for h in group)
      weighted_avg_cost = total_cost_amount / total_quantity if total_quantity > 0 else 0
      # 합산된 데이터
      aggregated.append({
        "stock_symbol": group[0]["stock_symbol"],
        "company_name": group[0]["company_name"],
        "company_name_en": group[0]["company_name_en"],
        "market_type": group[0]["market_type"],
        "currency": group[0]["currency"],
        "total_quantity": total_quantity,
        "average_cost_price": weighted_avg_cost,
        "total_cost_amount": total_cost_amount
      })
    
    return aggregated
  
  @staticmethod
  async def _get_price_safe(user_id: int, symbol: str, market_type: str) -> Dict:
    """안전한 주가 조회 - 완전한 거래 데이터가 있는 날짜 찾기"""
    try:
      # 1. 현재가 조회 시도
      current_data = await kis_api_service.get_stock_price(user_id, symbol, market_type)
      logger.info(f"현재가 조회: {symbol} = {current_data}")
      
      # 2. 휴장 상태 확인
      current_price = current_data.get("current_price", 0)
      previous_close = current_data.get("previous_close", 0) 
      day_change = current_data.get("day_change", 0)
      volume = current_data.get("volume", 0)
      
      # 3. 휴장 조건 확인
      if (current_price == previous_close and 
          day_change == 0.0 and 
          volume == 0):
        
        logger.info(f"휴장 감지: {symbol}, 완전한 거래 데이터 검색 시작")
        
        # 4. 완전한 거래 데이터가 있는 과거 날짜 찾기
        complete_data = await PortfolioService._find_complete_trading_data(
          user_id, symbol, market_type, max_days=10
        )
        
        if complete_data:
          logger.info(f"완전한 거래 데이터 발견: {symbol}, "
                     f"날짜={complete_data.get('query_date')}, "
                     f"변동률={complete_data.get('daily_return_rate')}")
          return complete_data
        else:
          logger.warning(f"완전한 거래 데이터 없음: {symbol}, 현재 데이터 사용")
          return current_data
      
      # 5. 정상 거래 중인 경우 현재 데이터 반환
      return current_data
      
    except Exception as e:
      logger.error(f"주가 조회 실패: {symbol}, {str(e)}")
      # API 실패 시 None 반환하여 에러 상황 명확히 표시
      return None

  @staticmethod
  async def _find_complete_trading_data(user_id: int, symbol: str, market_type: str, max_days: int = 10) -> Dict:
    """완전한 거래 데이터가 있는 날짜 찾기"""
    current_date = datetime.now()
    days_checked = 0
    
    while days_checked < max_days:
      days_checked += 1
      check_date = current_date - timedelta(days=days_checked)
      
      # 주말 건너뛰기
      if check_date.weekday() >= 5:  # 토/일요일
        continue
      
      date_str = check_date.strftime("%Y%m%d")
      
      try:
        logger.info(f"완전한 거래 데이터 검색: {symbol}, 날짜={date_str}")
        
        # 과거 날짜 데이터 조회
        historical_data = await kis_api_service.get_stock_price(
          user_id, symbol, market_type, date_str
        )
        
        # 완전한 거래 데이터 조건 확인
        current_price = historical_data.get("current_price", 0)
        previous_close = historical_data.get("previous_close", 0)
        day_change = historical_data.get("day_change", 0)
        volume = historical_data.get("volume", 0)
        daily_return_rate = historical_data.get("daily_return_rate", 0)
        
        # 완전한 데이터 조건: 거래량이 있고, 변동률이 계산되어 있음
        if (current_price > 0 and 
            volume > 0 and 
            not (current_price == previous_close and day_change == 0.0 and daily_return_rate == 0.0)):
          
          logger.info(f"완전한 거래 데이터 발견: {symbol}, 날짜={date_str}, "
                     f"거래량={volume:,}, 변동률={daily_return_rate}%")
          return historical_data
        
        logger.info(f"불완전한 데이터: {symbol}, 날짜={date_str}, 계속 검색...")
        
      except Exception as e:
        logger.warning(f"과거 데이터 조회 실패: {symbol}, 날짜={date_str}, {str(e)}")
        continue
    
    logger.warning(f"완전한 거래 데이터 찾기 실패: {symbol}, {max_days}일 내 데이터 없음")
    return None

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

    # 시장 타입에 따른 회사명 선택
    market_type = holding.get("market_type", "DOMESTIC")
    if market_type == "OVERSEAS":
      # 해외주식: 영문 회사명 사용 (없으면 한글명)
      company_name = holding.get("company_name_en") or holding["company_name"]
    else:
      # 국내주식: 한글 회사명 사용
      company_name = holding["company_name"]
    
    return StockDataResponse(
      symbol=holding["stock_symbol"],
      company_name=company_name,
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
  
  @staticmethod
  def _calculate_domestic_summary(stocks: List[StockDataResponse]) -> PortfolioSummaryData:
    """국내주식 요약 계산"""
    if not stocks:
      return PortfolioSummaryData(
        market_value=0.0,
        day_gain=0.0,
        day_gain_percent=0.0,
        total_gain=0.0,
        total_gain_percent=0.0
      )
    
    market_value = sum(stock.market_value for stock in stocks)
    day_gain = sum(stock.day_gain for stock in stocks)
    total_gain = sum(stock.total_gain for stock in stocks)
    total_cost = sum(stock.avg_cost * stock.shares for stock in stocks)
    
    day_gain_percent = (day_gain / market_value * 100) if market_value > 0 else 0.0
    total_gain_percent = (total_gain / total_cost * 100) if total_cost > 0 else 0.0
    
    return PortfolioSummaryData(
      market_value=market_value,
      day_gain=day_gain,
      day_gain_percent=day_gain_percent,
      total_gain=total_gain,
      total_gain_percent=total_gain_percent
    )

  @staticmethod
  def _calculate_overseas_summary(stocks: List[StockDataResponse]) -> PortfolioSummaryData:
    """해외주식 요약 계산 (USD 기준)"""
    if not stocks:
      return PortfolioSummaryData(
        market_value=0.0,
        day_gain=0.0,
        day_gain_percent=0.0,
        total_gain=0.0,
        total_gain_percent=0.0
      )
    
    market_value = sum(stock.market_value for stock in stocks)
    day_gain = sum(stock.day_gain for stock in stocks)
    total_gain = sum(stock.total_gain for stock in stocks)
    total_cost = sum(stock.avg_cost * stock.shares for stock in stocks)
    
    day_gain_percent = (day_gain / market_value * 100) if market_value > 0 else 0.0
    total_gain_percent = (total_gain / total_cost * 100) if total_cost > 0 else 0.0
    
    return PortfolioSummaryData(
      market_value=market_value,
      day_gain=day_gain,
      day_gain_percent=day_gain_percent,
      total_gain=total_gain,
      total_gain_percent=total_gain_percent
    )
  
  @staticmethod
  async def get_lots_by_broker(user_id: int, stock_symbol: str):
    """broker별 집계 + 현재가 조합"""
    from app.config.database import get_async_session
    from app.crud.transaction_crud import transaction_crud
    from app.crud.stock_crud import stock_crud
    
    db_gen = get_async_session()
    db = await db_gen.__anext__()
    
    try:
      # 1. DB에서 broker별 집계 데이터 조회
      lots_data = await transaction_crud.get_broker_holdings_per_stock(db, user_id, stock_symbol)
      
      if not lots_data:
        return []
      
      # 2. 종목 정보 조회
      stock = await stock_crud.get_stock_by_symbol(db, stock_symbol)
      if not stock:
        return []
      
      # 3. country_code로 market_type 결정
      market_type = "DOMESTIC" if stock.country_code == "KR" else "OVERSEAS"
            
       # 4. 현재가 조회 (_get_price_safe 사용)
      price_data = await PortfolioService._get_price_safe(user_id, stock_symbol, market_type)
      current_price = price_data.get("current_price", 0)
      
      # 5. 각 lot에 현재가와 평가금액 추가
      for lot in lots_data:
        lot["current_price"] = float(current_price)
        lot["market_value"] = float(lot["net_quantity"] * current_price)
      
      return lots_data
      
    finally:
      await db.close()

# 싱글톤 인스턴스
portfolio_service = PortfolioService()