from fastapi import APIRouter, Depends, Query
from typing import Optional, Dict
import logging

from app.external.exchange_rate_api import exchange_rate_service
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.common_schemas import ExchangeRateResponse, ExchangeRatesResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/usd-krw", response_model=ExchangeRateResponse)
async def get_usd_krw_rate(
  search_date: Optional[str] = Query(None, description="조회 날짜 (YYYYMMDD 형식, 없으면 최신)"),
  current_user: User = Depends(get_current_user)
):
  """
  USD/KRW 환율 조회
  """
  try:
    logger.info(f"USD/KRW 환율 조회 요청: user_id={current_user.id}, date={search_date}")
    
    rate_data = await exchange_rate_service.get_usd_krw_rate(search_date)
    
    # 간단한 응답 형태로 변환
    response = {
      "currency_code": "USD",
      "exchange_rate": rate_data["currency"]["exchange_rate"],
      "search_date": rate_data["search_date"],
      "updated_at": rate_data["retrieved_at"]
    }
    
    logger.info(f"USD/KRW 환율 조회 완료: {response['exchange_rate']}")
    return response
    
  except Exception as e:
    logger.error(f"환율 조회 중 오류: {str(e)}")
    # 환율 조회 실패 시 기본값 반환
    return {
      "currency_code": "USD",
      "exchange_rate": 1400.0,  # 기본값
      "search_date": search_date or "fallback",
      "updated_at": "fallback"
    }

@router.get("/rates", response_model=ExchangeRatesResponse)
async def get_exchange_rates(
  search_date: Optional[str] = Query(None, description="조회 날짜 (YYYYMMDD 형식, 없으면 최신)"),
  current_user: User = Depends(get_current_user)
):
  """
  전체 환율 정보 조회
  """
  try:
    logger.info(f"전체 환율 조회 요청: user_id={current_user.id}, date={search_date}")
    
    rates_data = await exchange_rate_service.get_exchange_rates(search_date)
    
    logger.info(f"환율 조회 완료: {rates_data['data_count']}개 통화")
    return rates_data
    
  except Exception as e:
    logger.error(f"환율 조회 중 오류: {str(e)}")
    # 환율 조회 실패 시 기본 응답
    return {
      "search_date": search_date or "fallback",
      "data_count": 1,
      "exchange_rates": {
        "USD": {
          "currency_code": "USD",
          "currency_name": "미국 달러",
          "exchange_rate": 1400.0
        }
      },
      "retrieved_at": "fallback"
    }