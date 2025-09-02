from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from typing import List
import logging

from app.config.database import get_async_session, get_sync_session
from app.crud.broker_crud import broker_crud
from app.crud.fee_tax_crud import fee_tax_crud
from app.models.user import User
from app.schemas.common_schemas import BrokerResponse, CommissionRateResponse
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/brokers", response_model=List[BrokerResponse])
async def get_supported_brokers(
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """
  지원하는 증권사 목록 조회
  """
  try:
    brokers = broker_crud.get_active_brokers_sync(db)
    logger.info(f"증권사 목록 조회: user_id={current_user.id}, count={len(brokers)}")
    return brokers
    
  except Exception as e:
    logger.error(f"증권사 목록 조회 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="증권사 목록을 불러올 수 없습니다.")

@router.get("/commission", response_model=CommissionRateResponse)
async def get_commission_rate(
  broker_id: int,
  market_type: str,
  transaction_type: str,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  증권사별 수수료율 조회
  """
  try:
    fee_info = await fee_tax_crud.get_broker_fee_info(
      db, broker_id, market_type, transaction_type
    )
    
    if not fee_info:
      return {
        "fee_rate": 0.00015,
        "transaction_tax_rate": 0.0023 if market_type == "DOMESTIC" else 0.0,
        "broker_name": "기본"
      }
    
    return {
      "fee_rate": float(fee_info.fee_rate),
      "transaction_tax_rate": float(fee_info.transaction_tax_rate),
      "broker_name": "조회된 증권사"
    }
    
  except Exception as e:
    logger.error(f"수수료율 조회 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="수수료율 조회 실패")

@router.get("/exchange-rates")
async def get_exchange_rates(
  current_user: User = Depends(get_current_user)
):
  """
  주요 환율 정보 조회
  """
  try:
    from app.external.exchange_rate_api import exchange_rate_service
    
    exchange_data = await exchange_rate_service.get_usd_krw_rate()
    
    return {
      "success": True,
      "data": {
        "usd_krw": exchange_data["currency"]["exchange_rate"],
        "updated_at": exchange_data["currency"]["last_updated"]
      }
    }
    
  except Exception as e:
    logger.error(f"환율 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="환율 정보를 불러올 수 없습니다.")

@router.get("/market-status")
async def get_market_status(
  current_user: User = Depends(get_current_user)
):
  """
  시장 상태 정보 (개장/폐장)
  """
  try:
    from datetime import datetime
    import pytz
    
    # 한국 시간
    kst = pytz.timezone('Asia/Seoul')
    now_kst = datetime.now(kst)
    
    # 간단한 장시간 체크 (9:00 ~ 15:30)
    market_open = now_kst.replace(hour=9, minute=0, second=0)
    market_close = now_kst.replace(hour=15, minute=30, second=0)
    
    is_market_open = (
      now_kst.weekday() < 5 and  # 월-금
      market_open <= now_kst <= market_close
    )
    
    return {
      "success": True,
      "data": {
        "is_market_open": is_market_open,
        "current_time_kst": now_kst.strftime("%Y-%m-%d %H:%M:%S"),
        "market_open_time": "09:00",
        "market_close_time": "15:30"
      }
    }
    
  except Exception as e:
    logger.error(f"시장 상태 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="시장 상태 정보를 불러올 수 없습니다.")