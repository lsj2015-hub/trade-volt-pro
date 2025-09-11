from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator

from app.config.database import get_sync_session
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# ==========================================
# 📋 Request/Response Schemas (클라이언트 타입과 일치)
# ==========================================

class VolatilityAnalysisRequest(BaseModel):
  """변동성 분석 요청 - 클라이언트 BaseStrategyRequest + 추가 필드"""
  country: str          # 국가 코드 (KR, US 등)
  market: str           # 시장 코드 (KOSPI, KOSDAQ, NYSE 등)
  start_date: str       # 시작일 (YYYY-MM-DD)
  end_date: str         # 종료일 (YYYY-MM-DD)
  decline_days: int     # 하락기간(일)
  decline_rate: float   # 하락률(%)
  recovery_days: int    # 회복기간(일) - 클라이언트는 recovery_days 사용
  recovery_rate: float  # 회복률(%) - 클라이언트는 recovery_rate 사용
  
  @validator('start_date', 'end_date')
  def validate_date_format(cls, v):
    try:
      datetime.strptime(v, '%Y-%m-%d')
      return v
    except ValueError:
      raise ValueError('날짜 형식은 YYYY-MM-DD 이어야 합니다.')

class VolatilityStockResult(BaseModel):
  """변동성 분석 결과 종목 - 클라이언트 타입과 정확히 일치"""
  rank: int
  stock_name: str
  stock_code: str
  occurrence_count: int
  last_decline_date: str
  last_decline_price: float
  last_recovery_date: str
  min_recovery_rate: float

class VolatilityAnalysisResponse(BaseModel):
  """변동성 분석 응답"""
  success: bool
  country: str
  market: str
  start_date: str
  end_date: str
  result_count: int
  data: List[VolatilityStockResult]
  message: str
  criteria: Dict[str, Any]  # 분석 기준 정보

# ==========================================
# 🎯 Strategy Endpoints
# ==========================================

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
    
    # ✅ 실제 변동성 분석 로직 실행 (Mock 데이터)
    stock_results = await _execute_volatility_analysis(request)
    
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
# 🔧 Helper Functions - Mock Data (향후 KIS API로 교체)
# ==========================================

async def _execute_volatility_analysis(request: VolatilityAnalysisRequest) -> List[VolatilityStockResult]:
  """
  변동성 분석 실행 함수 (현재 Mock 데이터)
  TODO: KIS OpenAPI와 연동하여 실제 시장 데이터 분석으로 교체
  """
  
  # 🇰🇷 한국 시장 Mock 데이터
  if request.country.upper() == 'KR':
    korean_mock_data = [
      VolatilityStockResult(
        rank=1,
        stock_name="삼성전자",
        stock_code="005930",
        occurrence_count=3,
        last_decline_date="2025-01-15",
        last_decline_price=82000.0,
        last_recovery_date="2025-01-22", 
        min_recovery_rate=15.2
      ),
      VolatilityStockResult(
        rank=2,
        stock_name="SK하이닉스",
        stock_code="000660",
        occurrence_count=2,
        last_decline_date="2025-01-16",
        last_decline_price=195000.0,
        last_recovery_date="2025-01-24",
        min_recovery_rate=22.8
      ),
      VolatilityStockResult(
        rank=3,
        stock_name="LG에너지솔루션",
        stock_code="373220",
        occurrence_count=4,
        last_decline_date="2025-01-14",
        last_decline_price=320000.0,
        last_recovery_date="2025-01-21",
        min_recovery_rate=18.7
      ),
      VolatilityStockResult(
        rank=4,
        stock_name="카카오",
        stock_code="035720",
        occurrence_count=2,
        last_decline_date="2025-01-17",
        last_decline_price=45000.0,
        last_recovery_date="2025-01-25",
        min_recovery_rate=25.3
      ),
      VolatilityStockResult(
        rank=5,
        stock_name="NAVER",
        stock_code="035420",
        occurrence_count=1,
        last_decline_date="2025-01-18",
        last_decline_price=165000.0,
        last_recovery_date="2025-01-26",
        min_recovery_rate=12.1
      )
    ]
    
    # 시장별 필터링 (KOSPI vs KOSDAQ)
    if request.market.upper() == "KOSDAQ":
      # KOSDAQ 종목만 반환 (예시로 카카오만)
      filtered_data = [stock for stock in korean_mock_data if stock.stock_code in ["035720"]]
    else:
      # KOSPI 종목들 반환
      filtered_data = [stock for stock in korean_mock_data if stock.stock_code not in ["035720"]]
  
  # 🇺🇸 미국 시장 Mock 데이터  
  elif request.country.upper() == 'US':
    us_mock_data = [
      VolatilityStockResult(
        rank=1,
        stock_name="Apple Inc.",
        stock_code="AAPL",
        occurrence_count=2,
        last_decline_date="2025-01-15",
        last_decline_price=185.50,
        last_recovery_date="2025-01-23",
        min_recovery_rate=14.8
      ),
      VolatilityStockResult(
        rank=2,
        stock_name="Tesla Inc.",
        stock_code="TSLA",
        occurrence_count=3,
        last_decline_date="2025-01-16",
        last_decline_price=210.20,
        last_recovery_date="2025-01-24",
        min_recovery_rate=28.4
      ),
      VolatilityStockResult(
        rank=3,
        stock_name="Microsoft Corporation",
        stock_code="MSFT",
        occurrence_count=1,
        last_decline_date="2025-01-17",
        last_decline_price=380.00,
        last_recovery_date="2025-01-25",
        min_recovery_rate=11.7
      ),
      VolatilityStockResult(
        rank=4,
        stock_name="NVIDIA Corporation",
        stock_code="NVDA",
        occurrence_count=2,
        last_decline_date="2025-01-18",
        last_decline_price=850.00,
        last_recovery_date="2025-01-26",
        min_recovery_rate=19.2
      )
    ]
    
    # 미국은 시장 구분 없이 모든 데이터 반환
    filtered_data = us_mock_data
  
  # 🌏 기타 국가 (빈 배열 반환)
  else:
    logger.warning(f"지원하지 않는 국가 코드: {request.country}")
    filtered_data = []
  
  # 📊 조건별 필터링 (실제로는 더 복잡한 로직)
  final_results = []
  for stock in filtered_data:
    # Mock에서는 모든 조건을 만족한다고 가정
    # 실제 구현에서는 decline_rate, recovery_rate 조건 체크
    meets_decline_criteria = abs(stock.min_recovery_rate) >= abs(request.decline_rate)
    meets_recovery_criteria = stock.min_recovery_rate >= request.recovery_rate
    
    if meets_decline_criteria and meets_recovery_criteria:
      final_results.append(stock)
  
  # 순위 재정렬 (occurrence_count 기준 내림차순)
  final_results.sort(key=lambda x: x.occurrence_count, reverse=True)
  for i, stock in enumerate(final_results, 1):
    stock.rank = i
  
  logger.info(f"Mock 분석 완료: 국가={request.country}, 시장={request.market}, 결과={len(final_results)}개")
  return final_results
