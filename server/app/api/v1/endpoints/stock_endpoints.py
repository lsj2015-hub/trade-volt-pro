from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.config.database import get_async_session
from app.crud.stock_crud import stock_crud
from app.schemas.common_schemas import StockInfo, StockPriceResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.external.kis_api import kis_api_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/search", response_model=List[StockInfo])
async def search_stocks(
  q: str = Query(..., min_length=1, max_length=50, description="검색어 (종목명, 영문명, 종목코드)"),
  limit: int = Query(20, ge=1, le=100, description="최대 결과 수"),
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)  # ✅ 타입과 실제 일치
):
  """
  빠른 종목 검색 API (가격 정보 없음)
  """
  try:
    logger.info(f"빠른 종목 검색 요청: user_id={current_user.id}, query='{q}', limit={limit}")
    
    stocks = await stock_crud.search_stocks_by_db(db, q, limit)
    
    logger.info(f"빠른 종목 검색 완료: {len(stocks)}개 결과 반환")
    return stocks
    
  except Exception as e:
    logger.error(f"빠른 종목 검색 중 오류 발생: {str(e)}")
    raise HTTPException(
      status_code=500, 
      detail=f"빠른 종목 검색 중 오류가 발생했습니다: {str(e)}"
    )

@router.get("/price/{symbol}", response_model=StockPriceResponse)
async def get_stock_price(
  symbol: str,
  market_type: str = Query("DOMESTIC", description="시장타입 (DOMESTIC/OVERSEAS)"),
  date: Optional[str] = Query(None, description="조회 날짜 (YYYYMMDD 형식, 없으면 현재가)"),
  current_user: User = Depends(get_current_user),
):
  """
  종목 시세 조회 API (KIS API 사용)
  """
  try:
    logger.info(f"주가 조회 요청: user_id={current_user.id}, symbol={symbol}, market_type={market_type}, date={date}")
    
    # KIS API를 통해 주가 정보 조회
    price_data = await kis_api_service.get_stock_price(current_user.id, symbol, market_type, date)
    
    # StockPriceResponse 형태로 변환
    stock_price = StockPriceResponse(
      symbol=price_data["symbol"],
      market_type=price_data["market_type"],
      current_price=price_data["current_price"],
      previous_close=price_data["previous_close"],
      daily_return_rate=price_data["daily_return_rate"],
      day_change=price_data["day_change"],
      volume=price_data["volume"],
      high_price=price_data["high_price"],
      low_price=price_data["low_price"],
      open_price=price_data["open_price"],
      currency=price_data["currency"],
      updated_at=price_data["updated_at"],
      query_date=price_data.get("query_date")
    )
    
    logger.info(f"주가 조회 완료: symbol={symbol}, price={price_data['current_price']}")
    return stock_price
    
  except Exception as e:
    logger.error(f"주가 조회 중 오류: symbol={symbol}, error={str(e)}")
    if "NO_PRICE_DATA" in str(e):
      raise HTTPException(status_code=404, detail="해당 종목의 시세 데이터를 찾을 수 없습니다.")
    elif "KIS_" in str(e):
      raise HTTPException(status_code=503, detail="외부 API 서비스 오류가 발생했습니다.")
    else:
      raise HTTPException(status_code=500, detail="주가 조회 중 오류가 발생했습니다.")