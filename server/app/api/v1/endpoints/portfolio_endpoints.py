from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Optional
from datetime import datetime
from app.config.database import get_async_session
from app.crud.holding_crud import holding_crud
from app.models.user import User
from app.schemas.common_schema import ( 
  CompletePortfolioResponse, RealizedProfitListResponse 
)
from app.core.dependencies import get_current_user
from app.services.portfolio_service import portfolio_service

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
  
@router.get("/realized-profits", response_model=RealizedProfitListResponse)
async def get_realized_profits(
  current_user: User = Depends(get_current_user),
  market_type: Optional[str] = Query(None, description="시장구분: 'domestic', 'overseas', None(전체)"),
  broker_id: Optional[int] = Query(None, description="증권사 ID"),
  stock_symbol: Optional[str] = Query(None, description="종목 심볼"),
  start_date: Optional[str] = Query(None, description="시작일 (YYYY-MM-DD)"),
  end_date: Optional[str] = Query(None, description="종료일 (YYYY-MM-DD)")
):
  """
  실현손익 내역 조회
  - 매도 거래별 실현손익 상세 내역
  - 필터링: 시장구분, 증권사, 종목, 기간
  """
  try:
    from app.services.portfolio_service import portfolio_service
    
    # 날짜 파라미터 변환
    start_datetime = None
    end_datetime = None
    
    if start_date:
      try:
        start_datetime = datetime.fromisoformat(start_date)
      except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 시작일 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
    
    if end_date:
      try:
        end_datetime = datetime.fromisoformat(end_date)
      except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 종료일 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
    
    # 시장구분 변환
    market_type_filter = None
    if market_type:
      if market_type.lower() == 'domestic':
        market_type_filter = 'DOMESTIC'
      elif market_type.lower() == 'overseas':
        market_type_filter = 'OVERSEAS'
      else:
        raise HTTPException(status_code=400, detail="시장구분은 'domestic' 또는 'overseas'만 가능합니다.")
    
    # Portfolio Service를 통한 실현손익 조회
    realized_profits = await portfolio_service.get_realized_profits(
      user_id=current_user.id,
      market_type=market_type_filter,
      broker_id=broker_id,
      stock_symbol=stock_symbol,
      start_date=start_datetime,
      end_date=end_datetime
    )
    
    logger.info(f"실현손익 API 조회 완료: user_id={current_user.id}, 건수={len(realized_profits)}")
    
    return {
      "success": True,
      "data": realized_profits,
      "total_count": len(realized_profits)
    }
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"실현손익 API 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="실현손익 정보를 불러올 수 없습니다.")