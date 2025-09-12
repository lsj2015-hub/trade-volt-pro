from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator

from app.config.database import get_sync_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.strategy_service import strategy_service
from app.schemas.common_schemas import (
  VolatilityAnalysisRequest, VolatilityStockResult, VolatilityAnalysisResponse, 
  PatternPeriod
)
from app.external.kis_api import kis_api_service
from app.crud.strategy_crud import strategy_crud

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/volatility-analysis", response_model=VolatilityAnalysisResponse)
async def run_volatility_analysis(
  request: VolatilityAnalysisRequest,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """
  변동성 분석 전략 실행
  
  - 지정된 기간 동안 하락 후 회복하는 종목들을 찾습니다
  - 하락률, 회복률, 기간 조건을 만족하는 종목들을 필터링합니다
  """
  start_time = datetime.now()
  
  try:
    logger.info(f"변동성 분석 시작: user_id={current_user.id}, country={request.country}, market={request.market}")
    
    # 날짜 검증
    start_date = datetime.strptime(request.start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(request.end_date, '%Y-%m-%d').date()
    
    if start_date >= end_date:
      raise HTTPException(status_code=400, detail="시작일은 종료일보다 이전이어야 합니다.")
    
    if (end_date - start_date).days > 365:
      raise HTTPException(status_code=400, detail="분석 기간은 최대 1년까지 가능합니다.")
    
    # 분석 기준 검증
    if request.decline_days <= 0 or request.recovery_days <= 0:
      raise HTTPException(status_code=400, detail="하락기간과 회복기간은 1일 이상이어야 합니다.")
    
    if request.decline_rate >= 0:
      raise HTTPException(status_code=400, detail="하락률은 음수여야 합니다.")
    
    if request.recovery_rate <= 0:
      raise HTTPException(status_code=400, detail="회복률은 양수여야 합니다.")
    
    # ✅ 실제 변동성 분석 로직 실행 (DB + KIS API)
    stock_results = await _execute_volatility_analysis(request, current_user.id)
    
    # 실행 시간 계산
    execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
    
    logger.info(f"변동성 분석 완료: user_id={current_user.id}, results={len(stock_results)}, time={execution_time}ms")
    
    return VolatilityAnalysisResponse(
      success=True,
      country=request.country,
      market=request.market,
      start_date=request.start_date,
      end_date=request.end_date,
      result_count=len(stock_results),
      data=stock_results,
      message=f"{len(stock_results)}개의 변동성 분석 결과를 찾았습니다.",
      criteria={
        "decline_days": request.decline_days,
        "decline_rate": request.decline_rate,
        "recovery_days": request.recovery_days,
        "recovery_rate": request.recovery_rate
      }
    )
    
  except HTTPException:
    raise
  except Exception as e:
    execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
    logger.error(f"변동성 분석 오류: user_id={current_user.id}, error={str(e)}, time={execution_time}ms", exc_info=True)
    raise HTTPException(status_code=500, detail="변동성 분석 중 오류가 발생했습니다.")

# ==========================================
# 🔧 Helper Functions - 실제 분석 로직 (KIS API + DB 연동)
# ==========================================

async def _execute_volatility_analysis(request: VolatilityAnalysisRequest, user_id: int) -> List[VolatilityStockResult]:
  """
  실제 변동성 분석 실행 (KIS API + DB 연동)
  
  Args:
    request: 변동성 분석 요청 데이터
    user_id: 사용자 ID (KIS API 토큰용)
  
  Returns:
    List[VolatilityStockResult]: 분석 결과 종목 리스트
  """
  
  try:
    # 날짜 변환
    start_date = datetime.strptime(request.start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(request.end_date, '%Y-%m-%d').date()
    
    logger.info(f"변동성 분석 실행: user_id={user_id}, 기간={start_date}~{end_date}")
    
    # 실제 변동성 분석 수행 (DB에서 종목 리스트, KIS API에서 주가 데이터)
    analysis_results = await strategy_service.analyze_volatility_patterns(
      user_id=user_id,
      country=request.country,
      market=request.market,
      start_date=start_date,
      end_date=end_date,
      decline_days=request.decline_days,
      decline_rate=request.decline_rate,
      recovery_days=request.recovery_days,
      recovery_rate=request.recovery_rate
    )
    
    # VolatilityStockResult 형태로 변환
    stock_results = []
    for result in analysis_results:
      # PatternPeriod 리스트 생성
      pattern_periods = []
      for period in result["pattern_periods"]:
        pattern_periods.append(PatternPeriod(
          start_date=period["start_date"],
          end_date=period["end_date"],
          decline_rate=period["decline_rate"],
          recovery_rate=period["recovery_rate"]
        ))

      stock_results.append(VolatilityStockResult(
        rank=result["rank"],
        stock_name=result["stock_name"],
        stock_code=result["stock_code"],
        occurrence_count=result["occurrence_count"],
        
        # 최근 패턴
        last_decline_end_date=result["last_decline_end_date"],
        last_decline_end_price=result["last_decline_end_price"],
        last_decline_rate=result["last_decline_rate"],
        
        # 최대 반등률 패턴
        max_recovery_date=result["max_recovery_date"],
        max_recovery_price=result["max_recovery_price"],
        max_recovery_rate=result["max_recovery_rate"],
        max_recovery_decline_rate=result["max_recovery_decline_rate"],
        
        # 패턴 구간
        pattern_periods=pattern_periods
      ))
    
    logger.info(f"변동성 분석 변환 완료: {len(stock_results)}개 종목")
    return stock_results
    
  except Exception as e:
    logger.error(f"변동성 분석 실행 실패: user_id={user_id}, error={str(e)}", exc_info=True)
    raise HTTPException(
      status_code=500, 
      detail=f"변동성 분석 중 오류가 발생했습니다: {str(e)}"
    )
  
# 파일 끝 부분에 추가
@router.get("/debug/db-status")
async def check_db_status(current_user: User = Depends(get_current_user)):
  """DB 상태 확인 (디버깅용)"""
  
  try:
    # 1. Country 테이블 확인
    countries = await strategy_crud.get_all_countries()
    
    # 2. Exchange 테이블 확인  
    exchanges = await strategy_crud.get_all_exchanges()
    
    # 3. Stock 테이블 확인
    stocks = await strategy_crud.get_all_stocks_sample(limit=10)
    
    return {
      "countries_count": len(countries),
      "countries": [{"code": c.country_code, "name": c.country_name} for c in countries],
      "exchanges_count": len(exchanges),
      "exchanges": [{"code": e.exchange_code, "name": e.exchange_name} for e in exchanges], 
      "stocks_count": len(stocks),
      "sample_stocks": [{"symbol": s.symbol, "name": s.company_name, "country": s.country_code, "exchange": s.exchange_code} for s in stocks]
    }
    
  except Exception as e:
    return {"error": str(e)}  

@router.post("/stock-chart-data", response_model=dict)
async def get_stock_chart_data(
  request: dict,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """
  종목별 차트 데이터 조회 (변동성 분석 차트용)
  
  - KIS API를 통해 실제 주가 데이터를 조회합니다
  - 프론트엔드 차트 표시용 데이터를 반환합니다
  """
  try:
    symbol = request.get("symbol")
    start_date = request.get("start_date")
    end_date = request.get("end_date")
    market_type = request.get("market_type", "DOMESTIC")
    
    if not all([symbol, start_date, end_date]):
      raise HTTPException(status_code=400, detail="symbol, start_date, end_date는 필수입니다.")
    
    logger.info(f"차트 데이터 조회: user_id={current_user.id}, symbol={symbol}")
    
    # KIS API에서 차트 데이터 조회
    chart_result = await kis_api_service.get_daily_chart_data(
      user_id=current_user.id,
      symbol=symbol,
      start_date=start_date.replace("-", ""),
      end_date=end_date.replace("-", ""),
      market_type=market_type
    )
    
    chart_data = chart_result.get("chart_data", [])
    
    # 응답 형식 변환
    response_data = []
    for item in chart_data:
      response_data.append({
        "date": item["date"],
        "open_price": str(item["open_price"]),
        "high_price": str(item["high_price"]),
        "low_price": str(item["low_price"]),
        "close_price": str(item["close_price"]),
        "volume": str(item["volume"])
      })
    
    period = f"{start_date}~{end_date}"
    
    return {
      "success": True,
      "symbol": symbol,
      "period": period,
      "data_count": len(response_data),
      "chart_data": response_data
    }
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"차트 데이터 조회 오류: user_id={current_user.id}, error={str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail="차트 데이터 조회 중 오류가 발생했습니다.")