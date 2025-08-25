import logging
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.stock import Stock
from app.models.country import Country
from app.models.exchange import Exchange
from app.schemas.common_schema import StockInfo, MarketType
from app.external.kis_api import kis_api_service

logger = logging.getLogger(__name__)

class StockService:
  """종목 관련 서비스"""
  
  def __init__(self, db: Session):
    self.db = db

  def search_stocks_by_db(self, query: str, limit: int = 20) -> List[dict]:
    """
    DB에서만 종목 검색 (가격 정보 없이, 빠른 검색용)
    Args:
      query: 검색어
      limit: 최대 결과 수
    Returns:
      List[dict]: 기본 종목 정보 리스트
    """
    try:
      stocks = self.db.query(Stock)\
        .join(Country)\
        .join(Exchange)\
        .filter(
          or_(
            Stock.company_name.ilike(f"%{query}%"),
            Stock.company_name_en.ilike(f"%{query}%"),
            Stock.symbol.ilike(f"%{query}%")
          )
        )\
        .filter(Stock.is_active == True)\
        .limit(limit)\
        .all()
      
      # dict로 변환 (StockInfo 스키마 형태)
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
      
    except Exception as e:
      logger.error(f"빠른 종목 검색 중 오류 발생: {str(e)}")
      raise
