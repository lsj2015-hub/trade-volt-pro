import asyncio
import logging
from typing import Dict, List
from datetime import datetime, timedelta

from sqlalchemy import select

from app.crud.holding_crud import holding_crud
from app.crud.stock_crud import stock_crud
from app.external.kis_api import kis_api_service
from app.external.exchange_rate_api import exchange_rate_service
from app.schemas.common_schemas import (
  StockDataResponse, CompletePortfolioResponse,  PortfolioSummaryData
)
from app.core.exceptions import CustomHTTPException
from app.config.database import get_async_session
from app.config.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class PortfolioService:
  """포트폴리오 서비스 - Holdings 기반 최적화 + KIS API 통합"""
  
  @staticmethod
  async def get_complete_portfolio(user_id: int) -> CompletePortfolioResponse:
    """완전한 포트폴리오 정보 조회 (Holdings 기반)"""
    db_gen = get_async_session()
    db = await db_gen.__anext__()
    
    try:
      # 1. Holdings 기반 포트폴리오 데이터와 환율 병렬 조회
      portfolio_task = holding_crud.get_user_portfolio_by_stocks(db, user_id)
      exchange_task = exchange_rate_service.get_usd_krw_rate()
      
      portfolio_data, exchange_data = await asyncio.gather(portfolio_task, exchange_task)
      exchange_rate = exchange_data["currency"]["exchange_rate"]
      
      if not portfolio_data:
        return PortfolioService._empty_response(exchange_rate)
      
      logger.info(f"Holdings 기반 포트폴리오 데이터: {len(portfolio_data)}개 종목")
      
      # 2. 각 Symbol의 현재가 조회 (병렬)
      price_tasks = [
        PortfolioService._get_price_safe(user_id, holding["stock_symbol"], holding["market_type"])
        for holding in portfolio_data
      ]
      price_results = await asyncio.gather(*price_tasks, return_exceptions=True)
      
      # 3. StockData 변환 및 국내/해외 분류
      domestic_stocks = []
      overseas_stocks = []
      
      for i, holding in enumerate(portfolio_data):
        price_data = price_results[i]
        
        # API 조회 실패한 종목은 건너뛰기
        if isinstance(price_data, Exception) or price_data is None:
          logger.warning(f"종목 {holding['stock_symbol']} 가격 조회 실패, 포트폴리오에서 제외")
          continue
        
        current_price = price_data["current_price"]
        previous_close = price_data["previous_close"] 
        
        # StockData 계산 (Holdings 기반)
        stock_data = PortfolioService._calculate_stock_data_from_holdings(
          holding, previous_close, current_price, exchange_rate
        )
        
        # 국내/해외 분류
        if holding["market_type"] == "DOMESTIC":
          domestic_stocks.append(stock_data)
        else:
          overseas_stocks.append(stock_data)
      
      # 4. 전체 합계 계산 (KRW 기준)
      totals = PortfolioService._calculate_totals(domestic_stocks, overseas_stocks, exchange_rate, portfolio_data)
      
      # 5. 국내/해외 요약 데이터 계산
      domestic_summary = PortfolioService._calculate_domestic_summary(domestic_stocks)
      overseas_summary = PortfolioService._calculate_overseas_summary(overseas_stocks)
      
      # 6. 전체 수익률 계산
      domestic_cost_krw = sum(stock.avg_cost * stock.shares for stock in domestic_stocks)
      overseas_cost_krw = sum(holding["total_investment_krw"] for holding in portfolio_data if holding.get("market_type") == "OVERSEAS")
      total_cost_krw = domestic_cost_krw + overseas_cost_krw

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
  async def get_stock_holdings_detail(user_id: int, stock_id: int):
    """특정 종목의 broker별 상세 보유현황 (Holdings 기반)"""
    db_gen = get_async_session()
    db = await db_gen.__anext__()
    
    try:
      # Holdings 기반 broker별 상세 조회
      holdings_data = await holding_crud.get_stock_holdings_by_brokers(db, user_id, stock_id)
      
      if not holdings_data["broker_details"]:
        return None
      
      # 현재가 조회
      stock_symbol = holdings_data.get("stock_symbol", "")
      market_type = "DOMESTIC" if holdings_data.get("currency") == "KRW" else "OVERSEAS"
      
      price_data = await PortfolioService._get_price_safe(user_id, stock_symbol, market_type)
      current_price = price_data.get("current_price", 0) if price_data else 0
      
      # 각 broker별 현재가와 평가금액 추가
      for broker_detail in holdings_data["broker_details"]:
        broker_detail["current_price"] = float(current_price)
        broker_detail["market_value"] = float(broker_detail["quantity"] * current_price)
        
        # 손익 계산
        total_cost = float(broker_detail["total_cost"])
        market_value = broker_detail["market_value"]
        broker_detail["unrealized_gain"] = market_value - total_cost
        broker_detail["unrealized_gain_percent"] = ((market_value - total_cost) / total_cost * 100) if total_cost > 0 else 0.0
      
      # 전체 요약에도 현재가 정보 추가
      holdings_data["current_price"] = float(current_price)
      summary = holdings_data["summary"]
      summary["current_market_value"] = summary["total_quantity"] * current_price
      summary["unrealized_gain"] = summary["current_market_value"] - summary["total_cost"]
      summary["unrealized_gain_percent"] = (summary["unrealized_gain"] / summary["total_cost"] * 100) if summary["total_cost"] > 0 else 0.0
      
      return holdings_data
      
    except Exception as e:
      logger.error(f"종목별 상세 조회 오류: user_id={user_id}, stock_id={stock_id}, error={str(e)}")
      raise
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
  def _calculate_stock_data_from_holdings(
      holding: Dict, previous_close: float, current_price: float, exchange_rate: float = 1.0
    ) -> StockDataResponse:
    """Holdings 데이터로부터 StockData 계산"""
    shares = holding["total_quantity"]
    avg_cost = holding["overall_average_cost"]
    market_value = shares * current_price
    
    # 해외주식과 국내주식 구분하여 손익 계산
    market_type = holding.get("market_type", "DOMESTIC")
    if market_type == "OVERSEAS":
      # 해외주식: USD 기준으로 계산
      total_cost = holding["total_investment"]  # USD 원가
      total_gain = market_value - total_cost    # USD 손익
      total_gain_percent = (total_gain / total_cost * 100) if total_cost > 0 else 0.0
    else:
      # 국내주식: KRW 기준
      total_cost = holding["total_investment"]
      total_gain = market_value - total_cost
      total_gain_percent = (total_gain / total_cost * 100) if total_cost > 0 else 0.0
    
    # 전일 대비 손익
    day_gain = shares * (current_price - previous_close)
    day_gain_percent = (day_gain / market_value * 100) if market_value > 0 else 0.0

    # 시장 타입에 따른 회사명 선택
    market_type = holding.get("market_type", "DOMESTIC")
    if market_type == "OVERSEAS":
      # 해외주식: 영문 회사명 사용 (없으면 한글명)
      company_name = holding.get("company_name_en") or holding["company_name"]
      day_gain = round(day_gain, 2)
      total_gain = round(total_gain, 2)
      market_value = round(market_value, 2)
      avg_cost = round(avg_cost, 2)
      current_price = round(current_price, 2)
    else:
      # 국내주식: 한글 회사명 사용
      company_name = holding["company_name"]
      day_gain = round(day_gain)
      total_gain = round(total_gain)
      market_value = round(market_value)
      avg_cost = round(avg_cost)
      current_price = round(current_price)
    
    return StockDataResponse(
      symbol=holding["stock_symbol"],
      company_name=company_name,
      shares=shares,
      avg_cost=avg_cost,
      current_price=current_price,
      market_value=market_value,
      day_gain=day_gain,
      day_gain_percent=day_gain_percent,
      total_gain=total_gain,
      total_gain_percent=total_gain_percent
    )
  
  @staticmethod
  def _calculate_totals(domestic_stocks: List[StockDataResponse], overseas_stocks: List[StockDataResponse], exchange_rate: float, portfolio_data: List[Dict]) -> Dict:
    """전체 합계 계산 (KRW 기준)"""
    # 국내 합계 (KRW)
    domestic_total = sum(stock.market_value for stock in domestic_stocks)
    domestic_day_gain = sum(stock.day_gain for stock in domestic_stocks)
    domestic_total_gain = sum(stock.total_gain for stock in domestic_stocks)
    
    # 해외 합계 (USD → KRW)
    overseas_total_usd = sum(stock.market_value for stock in overseas_stocks)
    overseas_day_gain_usd = sum(stock.day_gain for stock in overseas_stocks)
    
    # 해외주식 KRW 기준 Total Gain 별도 계산
    overseas_total_gain_krw = 0
    for stock in overseas_stocks:
      # portfolio_data에서 해당 종목의 holding 정보 찾기
      holding = next((h for h in portfolio_data if h["stock_symbol"] == stock.symbol and h.get("market_type") == "OVERSEAS"), None)
      if holding:
        total_cost_krw = holding["total_investment_krw"]
        market_value_krw = stock.market_value * exchange_rate
        overseas_total_gain_krw += (market_value_krw - total_cost_krw)
    
    overseas_total_krw = overseas_total_usd * exchange_rate
    overseas_day_gain_krw = overseas_day_gain_usd * exchange_rate
    
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
  
  async def get_lots_by_broker(self, user_id: int, stock_symbol: str):
    """특정 종목의 브로커별 상세 보유현황 """
    async with AsyncSessionLocal() as db:
      try:
        # 1. 종목 정보 조회
        stock = await stock_crud.get_stock_by_symbol(db, stock_symbol)
        if not stock:
          raise ValueError(f"종목을 찾을 수 없습니다: {stock_symbol}")
        
        # 2. 브로커별 보유현황 조회
        holdings_detail = await holding_crud.get_stock_holdings_by_brokers(
          db, user_id, stock.id
        )
        
        if not holdings_detail["broker_details"]:
          return []
        
        # 3. 현재가 조회 (비즈니스 로직)
        current_price = await self._get_current_price(user_id, stock_symbol, stock.country_code)
        
        # 4. 미실현 손익 계산 및 데이터 가공 (static method 사용)
        enhanced_lots = self._calculate_unrealized_gains(
          holdings_detail["broker_details"], current_price
        )
        
        return enhanced_lots
        
      except Exception as e:
        logger.error(f"브로커별 종목 상세 조회 실패: user_id={user_id}, symbol={stock_symbol}, error={str(e)}")
        raise

  async def _get_current_price(self, user_id: int, stock_symbol: str, country_code: str) -> float:
    """현재가 조회"""
    try:
      market_type = "DOMESTIC" if country_code == "KR" else "OVERSEAS"
      price_data = await kis_api_service.get_stock_price(user_id, stock_symbol, market_type)
      return price_data.get("current_price", 0.0)
    except Exception as e:
      logger.warning(f"현재가 조회 실패, 기본값 사용: {str(e)}")
      return 0.0
    
  @staticmethod
  def _calculate_unrealized_gains(broker_details: List[Dict], current_price: float) -> List[Dict]:
    """미실현 손익 계산"""
    enhanced_details = []
    for detail in broker_details:
      market_value = detail["quantity"] * current_price if current_price > 0 else 0.0
      unrealized_gain = market_value - detail["total_cost"] if current_price > 0 else 0.0
      unrealized_gain_percent = (unrealized_gain / detail["total_cost"] * 100) if detail["total_cost"] > 0 else 0.0
      
      enhanced_detail = {
        "broker_id": detail["broker_id"],
        "broker_name": detail["broker_name"],
        "net_quantity": detail["quantity"],
        "average_cost_price": detail["average_cost"],
        "total_cost": detail["total_cost"],
        "realized_gain": detail["realized_gain"],
        "realized_gain_krw": detail["realized_gain_krw"],
        "latest_transaction_date": detail["last_transaction_date"],
        "current_price": current_price,
        "market_value": market_value,
        "unrealized_gain": unrealized_gain,
        "unrealized_gain_percent": unrealized_gain_percent
      }
      enhanced_details.append(enhanced_detail)
    
    return enhanced_details

  @staticmethod
  async def get_realized_profits(user_id: int) -> Dict:
    """
    실현손익 내역 조회 (클라이언트 필터링 방식)
    - 모든 데이터를 한번에 가져와서 클라이언트에서 필터링
    """
    from app.config.database import get_async_session
    from app.crud.transaction_crud import transaction_crud
    
    db_gen = get_async_session()
    db = await db_gen.__anext__()
    
    try:
      # 1. 현재 환율 조회와 실현손익 데이터 조회를 병렬로 처리
      exchange_task = exchange_rate_service.get_usd_krw_rate()
      raw_data_task = transaction_crud.get_realized_profits_db(db=db, user_id=user_id)
      
      # 병렬 실행 (메타데이터는 raw_data에서 추출)
      exchange_data, raw_data = await asyncio.gather(
        exchange_task, raw_data_task
      )
      
      exchange_rate = exchange_data["currency"]["exchange_rate"]
      
      # 2. 메타데이터 수집 (실제 데이터에서 직접 추출)
      unique_stocks = {}
      unique_brokers = {}
      transactions = []
      
      # 3. 각 거래 데이터를 프론트엔드 형식으로 변환하면서 메타데이터도 수집
      for row in raw_data:
        # 시장 구분 결정
        market_type_value = "DOMESTIC" if row["country_code"] == "KR" else "OVERSEAS"
        
        # 회사명 결정 (해외주식은 영문명 우선)
        if market_type_value == "OVERSEAS":
          company_name = row.get("company_name_en") or row["company_name"]
          company_name_en = row.get("company_name_en", "")
        else:
          company_name = row["company_name"]
          company_name_en = ""
        
        # 수익률 계산
        realized_profit_percent = 0.0
        if row["avg_cost_at_transaction"] and row["avg_cost_at_transaction"] > 0:
          profit_per_share = float(row["price"] - row["avg_cost_at_transaction"])
          realized_profit_percent = profit_per_share / float(row["avg_cost_at_transaction"]) * 100
        
        # 원화 실현손익 계산 (매도 당시 환율 적용)
        realized_profit_krw = 0.0
        if row["total_realized_profit"]:
          if market_type_value == "OVERSEAS":
            # 해외주식: USD 실현손익 × 매도 당시 환율
            usd_profit = float(row["total_realized_profit"])
            sell_exchange_rate = float(row["exchange_rate"]) if row["exchange_rate"] else exchange_rate
            realized_profit_krw = usd_profit * sell_exchange_rate
          else:
            # 국내주식: 이미 KRW
            realized_profit_krw = float(row["total_realized_profit"])
            # 국내주식 계산 검증 로그
            logger.info(f"국내주식 실현손익: {row['symbol']} - KRW손익: {realized_profit_krw}")

            # 해외주식 계산 검증 로그
            logger.info(f"해외주식 실현손익 계산: {row['symbol']} - USD손익: {usd_profit}, 환율: {sell_exchange_rate}, KRW손익: {realized_profit_krw}")
        
        # 수익률 계산 검증 로그
        logger.info(f"수익률 계산: {row['symbol']} - 매도가: {row['price']}, 평단가: {row['avg_cost_at_transaction']}, 수익률: {realized_profit_percent}%")
        # 프론트엔드 형식으로 변환
        profit_item = {
          "id": str(row["id"]),
          "symbol": row["symbol"],
          "company_name": company_name,           
          "company_name_en": company_name_en,     
          "broker": row["broker_name"],
          "broker_id": row["broker_id"],          
          "market_type": market_type_value,       
          "sell_date": row["transaction_date"].isoformat(),  
          "shares": int(row["quantity"]),
          "sell_price": float(row["price"]),      
          "avg_cost": float(row["avg_cost_at_transaction"]) if row["avg_cost_at_transaction"] else 0.0,  
          "realized_profit": float(row["total_realized_profit"]) if row["total_realized_profit"] else 0.0,  
          "realized_profit_percent": round(realized_profit_percent, 2),  
          "realized_profit_krw": round(realized_profit_krw, 0),  
          "currency": row["currency"],
          "exchange_rate": float(row["exchange_rate"]) if row["exchange_rate"] else exchange_rate,  
          "commission": float(row["commission"]) if row["commission"] else 0.0,
          "transaction_tax": float(row["transaction_tax"]) if row["transaction_tax"] else 0.0  
        }
        transactions.append(profit_item)
        
        # 메타데이터 수집 (중복 제거)
        symbol = row["symbol"]
        if symbol not in unique_stocks:
          unique_stocks[symbol] = {
            "symbol": symbol,
            "company_name": row["company_name"],
            "company_name_en": row.get("company_name_en", "") or ""
          }
        
        broker_id = row["broker_id"]
        if broker_id not in unique_brokers:
          unique_brokers[broker_id] = {
            "id": broker_id,
            "name": row["broker_name"],
            "display_name": row["broker_name"]
          }
      
      # 4. 메타데이터 정렬
      available_stocks = sorted(unique_stocks.values(), key=lambda x: x["symbol"])
      available_brokers = sorted(unique_brokers.values(), key=lambda x: x["display_name"])
      
      # 5. 응답 데이터 구성
      response_data = {
        "success": True,
        "data": {
          "transactions": transactions,
          "metadata": {
            "available_stocks": available_stocks,
            "available_brokers": available_brokers
          }
        }
      }
      
      logger.info(f"실현손익 처리 완료: user_id={user_id}, 건수={len(transactions)}")
      return response_data
      
    finally:
      await db.close()


# 싱글톤 인스턴스
portfolio_service = PortfolioService()