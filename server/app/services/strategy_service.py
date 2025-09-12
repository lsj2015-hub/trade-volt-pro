import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, date
import asyncio
from dataclasses import dataclass

from app.external.kis_api import kis_api_service
from app.crud.strategy_crud import strategy_crud

logger = logging.getLogger(__name__)

@dataclass
class VolatilityPattern:
  """변동성 패턴 데이터 클래스"""
  symbol: str
  stock_name: str
  decline_start_date: str
  decline_end_date: str
  decline_rate: float
  recovery_start_date: str
  recovery_end_date: str
  recovery_rate: float
  decline_start_price: float
  recovery_end_price: float

class StrategyService:
  """전략 분석 서비스 (변동성 분석 등)"""
  
  async def analyze_volatility_patterns(
    self,
    user_id: int,
    country: str,
    market: str,
    start_date: date,
    end_date: date,
    decline_days: int,
    decline_rate: float,
    recovery_days: int,
    recovery_rate: float
  ) -> List[Dict]:
    """
    변동성 패턴 분석 메인 함수
    
    Args:
      user_id: 사용자 ID
      country: 국가 코드 (KR, US 등)
      market: 시장 코드 (KOSPI, KOSDAQ, NYSE, NASDAQ)
      start_date: 분석 시작일
      end_date: 분석 종료일
      decline_days: 하락 기간(일)
      decline_rate: 하락률(%) - 음수
      recovery_days: 반등 기간(일)
      recovery_rate: 반등률(%) - 양수
    """
    logger.info(f"변동성 분석 시작: {country}-{market}, {start_date}~{end_date}")
    
    # 1. DB에서 분석 대상 종목 리스트 가져오기 (CRUD 위임)
    target_stocks = await self._get_target_stocks_from_db(country, market)
    logger.info(f"분석 대상 종목: {len(target_stocks)}개")
    
    if not target_stocks:
      logger.warning(f"분석 대상 종목이 없습니다: {country}-{market}")
      return []
    
    # 2. 각 종목별로 패턴 분석
    analysis_results = []
    
    for stock_info in target_stocks:
      try:
        patterns = await self._analyze_stock_patterns(
          user_id=user_id,
          stock_info=stock_info,
          start_date=start_date,
          end_date=end_date,
          decline_days=decline_days,
          decline_rate=decline_rate,
          recovery_days=recovery_days,
          recovery_rate=recovery_rate,
          market_type=stock_info["market_type"]
        )
        
        if patterns:
          # 가장 최근 패턴 찾기
          latest_pattern = max(patterns, key=lambda p: p.recovery_end_date)
          
          # 최대 반등률 패턴 찾기
          max_recovery_pattern = max(patterns, key=lambda p: p.recovery_rate)
          
          # 차트용 패턴 구간 정보 생성
          pattern_periods = []
          for pattern in patterns:
            pattern_periods.append({
              "start_date": pattern.decline_start_date,
              "end_date": pattern.recovery_end_date,
              "decline_rate": pattern.decline_rate,
              "recovery_rate": pattern.recovery_rate
            })
          
          analysis_results.append({
            "rank": 0,  # 나중에 정렬 후 설정
            "stock_name": stock_info["company_name"],
            "stock_code": stock_info["symbol"],
            "occurrence_count": len(patterns),
            
            # 최근 패턴 정보
            "last_decline_end_date": latest_pattern.decline_end_date,
            "last_decline_end_price": latest_pattern.decline_start_price,  # 하락 시작 가격
            "last_decline_rate": latest_pattern.decline_rate,
            
            # 최대 반등률 패턴 정보
            "max_recovery_date": max_recovery_pattern.recovery_end_date,
            "max_recovery_price": max_recovery_pattern.recovery_end_price,
            "max_recovery_rate": max_recovery_pattern.recovery_rate,
            "max_recovery_decline_rate": max_recovery_pattern.decline_rate,
            
            # 차트용 패턴 구간
            "pattern_periods": pattern_periods
          })
          
        await asyncio.sleep(0.2)  # API 호출 간격 조절
        
      except Exception as e:
        logger.error(f"종목 {stock_info['symbol']} 분석 실패: {str(e)}")
        continue
    
    # 3. 결과 정렬 및 순위 부여 (발생 횟수 → 반등률 순)
    analysis_results.sort(key=lambda x: (-x["occurrence_count"], -x["max_recovery_rate"]))
    
    for i, result in enumerate(analysis_results, 1):
      result["rank"] = i
    
    logger.info(f"변동성 분석 완료: {len(analysis_results)}개 종목에서 패턴 발견")
    return analysis_results
  
  async def _get_target_stocks_from_db(self, country: str, market: str) -> List[Dict]:
    """DB에서 분석 대상 종목 리스트 조회 (CRUD 위임)"""
    
    # 모든 DB 작업은 strategy_crud에 위임
    return await strategy_crud.get_target_stocks_for_analysis(
      country_identifier=country,
      market_identifier=market,
      limit=50
    )
  
  async def _analyze_stock_patterns(
    self,
    user_id: int,
    stock_info: Dict,
    start_date: date,
    end_date: date,
    decline_days: int,
    decline_rate: float,
    recovery_days: int,
    recovery_rate: float,
    market_type: str
  ) -> List[VolatilityPattern]:
    """개별 종목의 변동성 패턴 분석"""
    
    symbol = stock_info["symbol"]
    stock_name = stock_info["company_name"]
    
    try:
      # 1. KIS API에서 일봉 데이터 조회 (실제 주가 데이터)
      chart_data = await kis_api_service.get_daily_chart_data(
        user_id=user_id,
        symbol=symbol,
        start_date=start_date.strftime("%Y%m%d"),
        end_date=end_date.strftime("%Y%m%d"),
        market_type=market_type
      )
      
      daily_prices = chart_data.get("chart_data", [])
      if len(daily_prices) < decline_days + recovery_days:
        logger.warning(f"{symbol}: 데이터 부족 ({len(daily_prices)}일)")
        return []
      
      # 2. 변동성 패턴 탐지
      patterns = self._find_volatility_patterns(
        daily_prices=daily_prices,
        decline_days=decline_days,
        decline_rate=decline_rate,
        recovery_days=recovery_days,
        recovery_rate=recovery_rate,
        symbol=symbol,
        stock_name=stock_name
      )
      
      logger.debug(f"{symbol}: {len(patterns)}개 패턴 발견")
      return patterns
      
    except Exception as e:
      logger.error(f"{symbol} KIS API 데이터 조회 실패: {str(e)}")
      return []
  
  def _find_volatility_patterns(
    self,
    daily_prices: List[Dict],
    decline_days: int,
    decline_rate: float,
    recovery_days: int,
    recovery_rate: float,
    symbol: str,
    stock_name: str
  ) -> List[VolatilityPattern]:
    """일봉 데이터에서 변동성 패턴 탐지 (가변 기간)"""
    
    patterns = []
    
    # 각 시작점에서 패턴 검색
    for i in range(len(daily_prices) - 1):  # 최소 2일 필요
      
      # 1일~decline_days일까지 모든 하락 기간 체크
      for actual_decline_days in range(1, min(decline_days + 1, len(daily_prices) - i)):
        
        decline_start_idx = i
        decline_end_idx = i + actual_decline_days - 1
        
        decline_start_price = daily_prices[decline_start_idx]["close_price"]
        decline_end_price = daily_prices[decline_end_idx]["close_price"]
        
        # 하락 수익률 계산
        actual_decline_rate = ((decline_end_price - decline_start_price) / decline_start_price) * 100
        
        # 하락 조건 확인 (decline_rate는 음수, actual_decline_rate도 음수여야 함)
        if actual_decline_rate <= decline_rate:
          
          # 하락 직후부터 1일~recovery_days일까지 모든 반등 기간 체크
          recovery_start_idx = decline_end_idx + 1
          
          if recovery_start_idx >= len(daily_prices):
            continue
            
          max_recovery_length = min(recovery_days, len(daily_prices) - recovery_start_idx)
          
          for actual_recovery_days in range(1, max_recovery_length + 1):
            
            recovery_end_idx = recovery_start_idx + actual_recovery_days - 1
            
            recovery_start_price = daily_prices[recovery_start_idx]["close_price"]
            recovery_end_price = daily_prices[recovery_end_idx]["close_price"]
            
            # 반등 수익률 계산
            actual_recovery_rate = ((recovery_end_price - recovery_start_price) / recovery_start_price) * 100
            
            # 반등 조건 확인 (recovery_rate는 양수, actual_recovery_rate도 양수여야 함)
            if actual_recovery_rate >= recovery_rate:
              
              pattern = VolatilityPattern(
                symbol=symbol,
                stock_name=stock_name,
                decline_start_date=daily_prices[decline_start_idx]["date"],
                decline_end_date=daily_prices[decline_end_idx]["date"],
                decline_rate=actual_decline_rate,
                recovery_start_date=daily_prices[recovery_start_idx]["date"],
                recovery_end_date=daily_prices[recovery_end_idx]["date"],
                recovery_rate=actual_recovery_rate,
                decline_start_price=decline_start_price,
                recovery_end_price=recovery_end_price
              )
              
              patterns.append(pattern)
              
              logger.debug(f"{symbol}: 패턴 발견 ({actual_decline_days}일 하락 {actual_decline_rate:.1f}% → {actual_recovery_days}일 반등 {actual_recovery_rate:.1f}%)")
              
              # 이 시작점에서 패턴을 찾았으므로 다음 하락 기간으로 건너뛰기
              break
          
          # 반등 패턴을 찾았다면 이 하락 기간에서 더 이상 검색하지 않음
          if patterns and patterns[-1].decline_start_date == daily_prices[decline_start_idx]["date"]:
            break
    
    # 중복 패턴 제거 (같은 시작일의 패턴은 하나만 유지)
    unique_patterns = []
    seen_start_dates = set()
    
    for pattern in patterns:
      if pattern.decline_start_date not in seen_start_dates:
        unique_patterns.append(pattern)
        seen_start_dates.add(pattern.decline_start_date)
    
    logger.debug(f"{symbol}: 총 {len(unique_patterns)}개 고유 패턴 발견")
    return unique_patterns

# 싱글톤 인스턴스
strategy_service = StrategyService()