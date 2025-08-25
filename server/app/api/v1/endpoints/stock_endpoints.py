from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from app.config.database import get_sync_session
from app.services.stock_service import StockService
from app.schemas.common_schema import StockInfo
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/search", response_model=List[StockInfo])
async def search_stocks_fast(
  q: str = Query(..., min_length=1, max_length=50, description="검색어 (종목명, 영문명, 종목코드)"),
  limit: int = Query(20, ge=1, le=100, description="최대 결과 수"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """
  빠른 종목 검색 API (가격 정보 없음)
  - 종목명, 영문 종목명, 종목코드로 검색 가능
  - DB에서만 조회하여 빠른 응답
  - 가격 정보는 포함되지 않음 (모두 0)
  
  Example:
    GET /api/v1/stocks/search-fast?q=삼성&limit=10
  """
  try:
    logger.info(f"빠른 종목 검색 요청: user_id={current_user.id}, query='{q}', limit={limit}")
    
    stock_service = StockService(db)
    stocks = stock_service.search_stocks_by_db(q, limit)
    
    logger.info(f"빠른 종목 검색 완료: {len(stocks)}개 결과 반환")
    return stocks
    
  except Exception as e:
    logger.error(f"빠른 종목 검색 중 오류 발생: {str(e)}")
    raise HTTPException(
      status_code=500, 
      detail=f"빠른 종목 검색 중 오류가 발생했습니다: {str(e)}"
    )

