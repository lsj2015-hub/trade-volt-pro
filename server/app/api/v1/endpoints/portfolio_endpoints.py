from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.config.database import get_async_session
from app.crud.holding_crud import holding_crud
from app.models.user import User
from app.schemas.common_schema import CompletePortfolioResponse, StockLotResponse
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=CompletePortfolioResponse)
async def get_complete_portfolio(
  current_user: User = Depends(get_current_user)
):
  """
  통합 포트폴리오 조회 (메인 대시보드용)
  - 전체 증권사 통합 포트폴리오 현황
  - 실시간 현재가 + 손익 계산
  - 국내/해외 요약 카드
  - 환율 정보
  """
  try:
    logger.info(f"포트폴리오 조회 요청: user_id={current_user.id}")
    
    from app.services.portfolio_service import portfolio_service
    portfolio_data = await portfolio_service.get_complete_portfolio(current_user.id)
    
    logger.info(f"포트폴리오 조회 완료: user_id={current_user.id}")
    return portfolio_data
    
  except Exception as e:
    logger.error(f"포트폴리오 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="포트폴리오 정보를 불러올 수 없습니다.")

@router.get("/overview")
async def get_portfolio_overview(
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  포트폴리오 개요/통계
  - 총 보유종목 수, 사용 브로커 수, 총 투자금액, 총 실현손익 등
  """
  try:
    overview = await holding_crud.get_user_portfolio_overview(db, current_user.id)
    
    return {
      "success": True,
      "data": overview
    }
    
  except Exception as e:
    logger.error(f"포트폴리오 개요 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="포트폴리오 개요 조회 중 오류가 발생했습니다.")

@router.get("/stocks")
async def get_portfolio_stocks(
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  종목별 포트폴리오 요약 (모든 브로커 합산)
  - 각 종목별 총 보유량, 전체 평균단가, 투자금액, 실현손익 등
  """
  try:
    portfolio = await holding_crud.get_user_portfolio_by_stocks(db, current_user.id)
    
    return {
      "success": True,
      "data": portfolio,
      "total_count": len(portfolio)
    }
    
  except Exception as e:
    logger.error(f"종목별 포트폴리오 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="종목별 포트폴리오 조회 중 오류가 발생했습니다.")

@router.get("/stocks/{stock_symbol}/detail")
async def get_stock_detail_by_brokers(
  stock_symbol: str,
  current_user: User = Depends(get_current_user),
):
  """
  특정 종목의 브로커별 상세 보유현황 (종목 상세 페이지용)
  - 브로커별 보유량, 평균단가, 손익
  - 실시간 현재가 + 평가금액
  - 실현/미실현 손익
  """
  try:
    logger.info(f"종목별 브로커 상세 조회: user_id={current_user.id}, symbol={stock_symbol}")
    
    from app.services.portfolio_service import portfolio_service
    lots = await portfolio_service.get_lots_by_broker(current_user.id, stock_symbol)
    
    if not lots:
      raise HTTPException(status_code=404, detail="해당 종목의 보유 정보를 찾을 수 없습니다.")
    
    logger.info(f"종목별 브로커 상세 조회 완료: {len(lots)}건")
    return {
      "success": True,
      "data": lots,
      "total_count": len(lots)
    }
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"종목별 브로커 상세 조회 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="종목별 상세 정보를 불러올 수 없습니다.")