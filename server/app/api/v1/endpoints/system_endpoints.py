from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from decimal import Decimal
import logging

from app.config.database import get_async_session
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
  db: AsyncSession = Depends(get_async_session)
):
  """
  지원하는 증권사 목록 조회
  """
  try:
    brokers = await broker_crud.get_active_brokers_async(db)
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
  증권사별 수수료율 조회 (개선된 CRUD 사용)
  """
  try:
    fee_info = await fee_tax_crud.get_broker_fee_info(
      db, broker_id, market_type, transaction_type
    )
    
    # 브로커 정보 조회
    broker = await broker_crud.get_broker_by_id(db, broker_id)
    broker_name = broker.display_name if broker else "알 수 없는 증권사"
    
    if not fee_info:
      logger.info(f"수수료율 기본값 적용: user_id={current_user.id}, broker_id={broker_id}")
      return CommissionRateResponse(
        fee_rate=0.00015,
        transaction_tax_rate=0.0023 if market_type == "DOMESTIC" else 0.0,
        broker_name=f"{broker_name} (기본)"
      )
    
    logger.info(f"수수료율 조회 완료: user_id={current_user.id}, broker_id={broker_id}, market_type={market_type}")
    return CommissionRateResponse(
      fee_rate=float(fee_info.fee_rate),
      transaction_tax_rate=float(fee_info.transaction_tax_rate) if fee_info.transaction_tax_rate else 0.0,
      broker_name=broker_name
    )
    
  except Exception as e:
    logger.error(f"수수료율 조회 중 오류: user_id={current_user.id}, broker_id={broker_id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="수수료율 조회 실패")

@router.get("/commission/calculate")
async def calculate_fees(
  broker_id: int,
  market_type: str,
  transaction_type: str,
  price: float = Query(..., gt=0, description="주당 가격"),
  quantity: int = Query(..., gt=0, description="거래 수량"),
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  수수료 계산 (개선된 CRUD 사용)
  """
  try:
    # Decimal 변환
    price_decimal = Decimal(str(price))
    
    # 총 수수료 계산
    fee_result = await fee_tax_crud.calculate_total_fees(
      db=db,
      broker_id=broker_id,
      market_type=market_type,
      transaction_type=transaction_type,
      price=price_decimal,
      quantity=quantity
    )
    
    # 브로커 정보 조회
    broker = await broker_crud.get_broker_by_id(db, broker_id)
    broker_name = broker.display_name if broker else "알 수 없는 증권사"
    
    result = {
      "success": True,
      "data": {
        "broker_id": broker_id,
        "broker_name": broker_name,
        "market_type": market_type,
        "transaction_type": transaction_type,
        "price": float(price),
        "quantity": quantity,
        "gross_amount": float(fee_result["gross_amount"]),
        "commission": float(fee_result["commission"]),
        "transaction_tax": float(fee_result["transaction_tax"]),
        "total_fees": float(fee_result["total_fees"]),
        "net_amount": float(fee_result["net_amount"])
      }
    }
    
    logger.info(f"수수료 계산 완료: user_id={current_user.id}, broker_id={broker_id}, "
               f"amount={fee_result['gross_amount']}, total_fees={fee_result['total_fees']}")
    return result
    
  except ValueError as ve:
    logger.error(f"수수료 계산 입력값 오류: user_id={current_user.id}, error={str(ve)}")
    raise HTTPException(status_code=400, detail=str(ve))
  except Exception as e:
    logger.error(f"수수료 계산 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="수수료 계산 중 오류가 발생했습니다.")

@router.get("/commission/schedule/{broker_id}")
async def get_fee_schedule(
  broker_id: int,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  증권사별 전체 수수료 체계 조회 (새로운 기능)
  """
  try:
    # 브로커 존재 확인
    broker = await broker_crud.get_broker_by_id(db, broker_id)
    if not broker:
      raise HTTPException(status_code=404, detail="존재하지 않는 증권사입니다.")
    
    # 수수료 체계 조회
    fee_schedule = await fee_tax_crud.get_fee_schedule(db, broker_id)
    
    result = {
      "success": True,
      "data": {
        "broker_id": broker_id,
        "broker_name": broker.display_name,
        "fee_schedule": fee_schedule
      }
    }
    
    logger.info(f"수수료 체계 조회 완료: user_id={current_user.id}, broker_id={broker_id}")
    return result
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"수수료 체계 조회 중 오류: user_id={current_user.id}, broker_id={broker_id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="수수료 체계 조회 중 오류가 발생했습니다.")

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