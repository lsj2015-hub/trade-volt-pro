import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import joinedload

from app.models.stock import Stock
from app.models.country import Country
from app.models.exchange import Exchange

logger = logging.getLogger(__name__)

class StockCRUD:
  """종목 관련 CRUD"""
  
  async def search_stocks_by_db(
    self, 
    db: AsyncSession, 
    query: str, 
    limit: int = 20
  ) -> List[dict]:
    """DB에서만 종목 검색 (가격 정보 없이, 빠른 검색용)"""
    search_query = (
      select(Stock)
      .options(
        joinedload(Stock.country),
        joinedload(Stock.exchange)
      )
      .filter(
        and_(
          or_(
            Stock.company_name.ilike(f"%{query}%"),
            Stock.company_name_en.ilike(f"%{query}%"),
            Stock.symbol.ilike(f"%{query}%")
          ),
          Stock.is_active == True
        )
      )
      .limit(limit)
    )
    
    try:
      result = await db.execute(search_query)
      stocks = result.scalars().all()
    except Exception as e:
      logger.error(f"종목 검색 실패: query={query}, error={str(e)}")
      raise
    
    # dict로 변환
    results = []
    for stock in stocks:
      market_type = "DOMESTIC" if stock.country_code == "KR" else "OVERSEAS"
      
      result = {
        "symbol": stock.symbol,
        "company_name": stock.company_name,
        "company_name_en": stock.company_name_en or "",
        "corp_cord": stock.corp_code or "",
        "country_code": stock.country_code,
        "exchange_code": stock.exchange_code,
        "currency": stock.currency,
        "market_type": market_type,
      }
      results.append(result)
    
    logger.info(f"빠른 종목 검색 완료: 검색어={query}, 결과={len(results)}개")
    return results
  
  async def get_stock_by_symbol(
    self, 
    db: AsyncSession, 
    symbol: str
  ) -> Optional[Stock]:
    """심볼로 종목 조회"""
    query = (
      select(Stock)
      .options(
        joinedload(Stock.country),
        joinedload(Stock.exchange)
      )
      .filter(
        and_(
          Stock.symbol == symbol,
          Stock.is_active == True
        )
      )
    )
    
    try:
      result = await db.execute(query)
      return result.scalar_one_or_none()
    except Exception as e:
      logger.error(f"종목 조회 실패: symbol={symbol}, error={str(e)}")
      raise
  
  async def get_stock_by_id(
    self,
    db: AsyncSession,
    stock_id: int
  ) -> Optional[Stock]:
    """ID로 종목 조회"""
    query = (
      select(Stock)
      .options(
        joinedload(Stock.country),
        joinedload(Stock.exchange)
      )
      .filter(
        and_(
          Stock.id == stock_id,
          Stock.is_active == True
        )
      )
    )
    
    try:
      result = await db.execute(query)
      return result.scalar_one_or_none()
    except Exception as e:
      logger.error(f"종목 조회 실패: stock_id={stock_id}, error={str(e)}")
      raise

# 싱글톤 인스턴스
stock_crud = StockCRUD()