from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging

from app.config.database import get_sync_session
from app.schemas.common_schemas import (
  AnalysisInfoType, AnalysisResponse, CompanySummaryResponse,
  FinancialSummaryResponse, InvestmentIndexResponse, MarketInfoResponse,
  AnalystOpinionResponse, MajorExecutorsResponse
)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.analysis_service import analysis_service
from app.external.exchange_rate_api import exchange_rate_service

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_exchange_rate() -> float:
  """환율 정보 조회"""
  try:
    exchange_data = await exchange_rate_service.get_usd_krw_rate()
    return exchange_data["currency"]["exchange_rate"]
  except Exception as e:
    logger.warning(f"환율 조회 실패, 기본값 사용: {e}")
    return 1300.0

@router.get("/{symbol}", response_model=AnalysisResponse)
async def get_stock_analysis(
  symbol: str,
  info_type: AnalysisInfoType = Query(..., description="조회할 정보 유형"),
  country_code: str = Query("US", description="국가 코드"),
  company_name: str = Query("", description="회사명"),
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ)"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """종목 분석 정보 조회"""
  try:
    logger.info(f"종목 분석 요청: user_id={current_user.id}, symbol={symbol}, info_type={info_type.value}, exchange_code={exchange_code}")
    
    symbol = symbol.upper()
    exchange_rate = await get_exchange_rate()
    
    if info_type == AnalysisInfoType.COMPANY_SUMMARY:
      data = analysis_service.get_company_summary(symbol, country_code, company_name, exchange_code)
    elif info_type == AnalysisInfoType.FINANCIAL_SUMMARY:
      data = analysis_service.get_financial_summary(symbol, db, exchange_rate)
    elif info_type == AnalysisInfoType.INVESTMENT_INDEX:
      data = analysis_service.get_investment_index(symbol, db)
    elif info_type == AnalysisInfoType.MARKET_INFO:
      data = analysis_service.get_market_info(symbol, db, exchange_rate)
    elif info_type == AnalysisInfoType.ANALYST_OPINION:
      data = analysis_service.get_analyst_opinion(symbol, db)
    elif info_type == AnalysisInfoType.MAJOR_EXECUTORS:
      data = analysis_service.get_major_executors(symbol, exchange_rate, exchange_code, country_code)
    else:
      raise HTTPException(status_code=400, detail="지원하지 않는 정보 유형입니다.")
    
    if not data:
      raise HTTPException(
        status_code=404,
        detail=f"'{symbol}'에 대한 {info_type.value} 정보를 찾을 수 없습니다."
      )
    
    logger.info(f"종목 분석 완료: user_id={current_user.id}, symbol={symbol}")
    return AnalysisResponse(
      symbol=symbol,
      info_type=info_type.value,
      data=data,
      success=True
    )
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"종목 분석 조회 오류 (symbol: {symbol}, type: {info_type}): {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")

@router.get("/{symbol}/company-summary", response_model=CompanySummaryResponse)
async def get_company_summary(
  symbol: str,
  country_code: str = Query("US", description="국가 코드"),
  company_name: str = Query("", description="회사명"),
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ)"),
  current_user: User = Depends(get_current_user)
):
  """회사 기본 정보 조회"""
  try:
    logger.info(f"회사 정보 요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = analysis_service.get_company_summary(symbol.upper(), country_code, company_name, exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 회사 정보를 찾을 수 없습니다.")
    
    logger.info(f"회사 정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"회사 정보 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="회사 정보 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/financial-summary", response_model=FinancialSummaryResponse)
async def get_financial_summary(
  symbol: str,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """재무 요약 정보 조회"""
  try:
    logger.info(f"재무요약 정보요청: user_id={current_user.id}, symbol={symbol}")
    
    exchange_rate = await get_exchange_rate()
    data = analysis_service.get_financial_summary(symbol.upper(), db, exchange_rate)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 재무 정보를 찾을 수 없습니다.")
    
    logger.info(f"재무요약 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"재무요약 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="재무요약 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/investment-index", response_model=InvestmentIndexResponse)
async def get_investment_index(
  symbol: str,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """투자 지표 조회"""
  try:
    logger.info(f"투자지표 정보요청: user_id={current_user.id}, symbol={symbol}")
    
    data = analysis_service.get_investment_index(symbol.upper(), db)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 투자지표를 찾을 수 없습니다.")
    
    logger.info(f"투자지표 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"투자지표 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="투자지표 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/market-info", response_model=MarketInfoResponse)
async def get_market_info(
  symbol: str,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """시장 정보 조회"""
  try:
    logger.info(f"시장정보 정보요청: user_id={current_user.id}, symbol={symbol}")
    
    exchange_rate = await get_exchange_rate()
    data = analysis_service.get_market_info(symbol.upper(), db, exchange_rate)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 시장 정보를 찾을 수 없습니다.")
    
    logger.info(f"시장정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data

  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"시장정보 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="시장정보 조회 중 오류가 발생했습니다.")
  
@router.get("/{symbol}/analyst-opinion", response_model=AnalystOpinionResponse)
async def get_analyst_opinion(
  symbol: str,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """애널리스트 의견 조회"""
  try:
    logger.info(f"애널리스트 정보요청: user_id={current_user.id}, symbol={symbol}")
    
    data = analysis_service.get_analyst_opinion(symbol.upper(), db)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 애널리스트 정보를 찾을 수 없습니다.")
    
    logger.info(f"애널리스트 의견 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"애널리스트 의견 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="애널리스트 의견 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/major-executors", response_model=MajorExecutorsResponse)
async def get_major_executors(
  symbol: str,
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ)"),
  country_code: str = Query("US", description="국가 코드"),
  current_user: User = Depends(get_current_user)
):
  """주요 임원진 조회"""
  try:
    logger.info(f"주요 임원진 정보요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}, , country_code={country_code}")
    
    exchange_rate = await get_exchange_rate()
    data = analysis_service.get_major_executors(symbol.upper(), exchange_rate, exchange_code, country_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 임원진 정보를 찾을 수 없습니다.")
    
    logger.info(f"임원진 정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"주요 임원진 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="주요 임원진 조회 중 오류가 발생했습니다.")