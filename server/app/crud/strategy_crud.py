import logging
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload

from app.models.stock import Stock
from app.models.country import Country
from app.models.exchange import Exchange
from app.config.database import get_async_session

logger = logging.getLogger(__name__)

class StrategyCRUD:
  """전략 분석용 CRUD"""
  
  async def get_country_by_name_or_code(
    self, 
    db: AsyncSession, 
    country_identifier: str
  ) -> Optional[Country]:
    """국가명 또는 국가코드로 국가 정보 조회 (DB 직접 검색)"""
    
    search_term = country_identifier.strip()
    
    query = select(Country).filter(
      and_(
        Country.is_active == True,
        or_(
          Country.country_code.ilike(search_term),              # KR, US, JP
          Country.country_name.ilike(f"%{search_term}%"),       # 대한민국, 미국, 일본
          Country.country_name_en.ilike(f"%{search_term}%")     # South Korea, United States, Japan
        )
      )
    )
    
    try:
      result = await db.execute(query)
      country = result.scalar_one_or_none()
      logger.info(f"국가 조회: {country_identifier} → {country.country_code if country else 'Not Found'}")
      return country
    except Exception as e:
      logger.error(f"국가 조회 실패: {country_identifier}, error={str(e)}")
      raise
  
  async def get_exchange_by_name_and_country(
    self,
    db: AsyncSession,
    exchange_identifier: str,
    country: Country
  ) -> Optional[Exchange]:
    """거래소명과 국가 정보로 거래소 정보 조회 (DB 직접 검색)"""
    
    search_term = exchange_identifier.strip()
    
    query = (
      select(Exchange)
      .options(joinedload(Exchange.country))
      .filter(
        and_(
          Exchange.country_id == country.id,  # country.id로 조인
          Exchange.is_active == True,
          or_(
            Exchange.exchange_code.ilike(search_term),           # KOSPI, KOSDAQ, NYSE, NASDAQ
            Exchange.exchange_name.ilike(f"%{search_term}%"),    # 코스피, 코스닥, 뉴욕증권거래소  
            Exchange.exchange_name_en.ilike(f"%{search_term}%")  # Korea Composite, New York Stock Exchange
          )
        )
      )
    )
    
    try:
      result = await db.execute(query)
      exchange = result.scalar_one_or_none()
      logger.info(f"거래소 조회: {exchange_identifier}+{country.country_code} → {exchange.exchange_code if exchange else 'Not Found'}")
      return exchange
    except Exception as e:
      logger.error(f"거래소 조회 실패: {exchange_identifier}+{country.country_code}, error={str(e)}")
      raise
  
  async def get_stocks_by_country_and_exchange(
    self,
    db: AsyncSession,
    country: Country,
    exchange: Exchange,
    limit: int = 50
  ) -> List[Stock]:
    """특정 국가의 특정 거래소 주식 종목 리스트 조회"""
    
    if country.country_code == 'KR':
      query = (
        select(Stock)
        .options(
          joinedload(Stock.country),
          joinedload(Stock.exchange)  
        )
        .filter(
          and_(
            Stock.country_code == country.country_code,
            Stock.exchange_code == exchange.exchange_code,
            Stock.is_active == True,
            Stock.corp_code.isnot(None)  # 한국: 실제 상장 주식만
          )
        )
        .limit(limit)
      )
    else:
      # 해외의 경우 기존 로직
      query = (
        select(Stock)
        .options(
          joinedload(Stock.country),
          joinedload(Stock.exchange)  
        )
        .filter(
          and_(
            Stock.country_code == country.country_code,
            Stock.exchange_code == exchange.exchange_code,
            Stock.is_active == True
          )
        )
        .limit(limit)
      )
    
    try:
      result = await db.execute(query)
      stocks = result.scalars().all()
      logger.info(f"종목 리스트 조회 완료: {country.country_code}-{exchange.exchange_code}, {len(stocks)}개")
      return stocks
    except Exception as e:
      logger.error(f"종목 리스트 조회 실패: {country.country_code}-{exchange.exchange_code}, error={str(e)}")
      raise
  
  async def get_target_stocks_for_analysis(
    self,
    country_identifier: str,
    market_identifier: str,
    limit: int = 50
  ) -> List[Dict]:
    """변동성 분석용 종목 리스트 조회 (전체 프로세스를 CRUD에서 처리)"""
    
    async for db in get_async_session():
      try:
        # 1. 국가 정보 조회
        country_info = await self.get_country_by_name_or_code(db, country_identifier)
        if not country_info:
          logger.error(f"지원하지 않는 국가: {country_identifier}")
          return []
        
        # 2. 거래소 정보 조회
        exchange_info = await self.get_exchange_by_name_and_country(
          db, market_identifier, country_info
        )
        if not exchange_info:
          logger.error(f"지원하지 않는 거래소: {market_identifier} in {country_info.country_code}")
          return []
        
        # 3. 해당 거래소의 종목 리스트 조회
        stocks = await self.get_stocks_by_country_and_exchange(
          db, country_info, exchange_info, limit
        )
        
        # Dict 형태로 변환
        stock_list = []
        for stock in stocks:
          market_type = "DOMESTIC" if stock.country_code == "KR" else "OVERSEAS"
          
          stock_list.append({
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "country_code": stock.country_code,
            "exchange_code": stock.exchange_code,
            "market_type": market_type,
            "currency": stock.currency
          })
        
        logger.info(f"변동성 분석용 종목 조회 완료: {country_info.country_code}-{exchange_info.exchange_code}, {len(stock_list)}개")
        return stock_list
        
      except Exception as e:
        logger.error(f"변동성 분석용 종목 조회 실패: {country_identifier}-{market_identifier}, error={str(e)}")
        return []
      
  # 클래스 내부에 추가
async def get_all_countries(self) -> List[Country]:
  """모든 국가 조회 (디버깅용)"""
  async for db in get_async_session():
    try:
      result = await db.execute(select(Country).where(Country.is_active == True))
      return result.scalars().all()
    except Exception as e:
      logger.error(f"국가 목록 조회 실패: {str(e)}")
      return []

async def get_all_exchanges(self) -> List[Exchange]:
  """모든 거래소 조회 (디버깅용)"""
  async for db in get_async_session():
    try:
      result = await db.execute(select(Exchange).where(Exchange.is_active == True))
      return result.scalars().all()
    except Exception as e:
      logger.error(f"거래소 목록 조회 실패: {str(e)}")
      return []

async def get_all_stocks_sample(self, limit: int = 10) -> List[Stock]:
  """종목 샘플 조회 (디버깅용)"""
  async for db in get_async_session():
    try:
      result = await db.execute(
        select(Stock)
        .where(Stock.is_active == True)
        .limit(limit)
      )
      return result.scalars().all()
    except Exception as e:
      logger.error(f"종목 샘플 조회 실패: {str(e)}")
      return []

# 싱글톤 인스턴스
strategy_crud = StrategyCRUD()