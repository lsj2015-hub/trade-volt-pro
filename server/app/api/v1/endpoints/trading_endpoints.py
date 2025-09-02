from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from decimal import Decimal

from app.config.database import get_async_session
from app.crud.transaction_crud import transaction_crud
from app.crud.broker_crud import broker_crud
from app.crud.fee_tax_crud import fee_tax_crud
from app.models.user import User
from app.schemas.common_schemas import TransactionCreateRequest, TransactionResponse
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/order", response_model=TransactionResponse)
async def create_order(
  request: TransactionCreateRequest,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  매수/매도 주문 생성 (Holdings 자동 업데이트)
  """
  try:
    # 종목 조회
    stock = await transaction_crud.get_stock_by_symbol(db, request.symbol)
    if not stock:
      raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다.")
    
    # 수수료 계산
    if request.commission is None or request.transaction_tax is None:
      fee_result = await fee_tax_crud.calculate_total_fees(
        db=db,
        broker_id=request.broker_id,
        market_type=request.market_type,
        transaction_type=request.transaction_type,
        price=Decimal(str(request.price)),
        quantity=request.quantity
      )
      commission = fee_result["commission"]
      transaction_tax = fee_result["transaction_tax"]
    else:
      commission = Decimal(str(request.commission))
      transaction_tax = Decimal(str(request.transaction_tax))

    # 환율 자동 계산
    if request.market_type == 'OVERSEAS':
      # 거래 날짜의 환율 조회
      transaction_date_str = request.transaction_date.strftime('%Y%m%d')
      try:
        from app.external.exchange_rate_api import exchange_rate_service
        exchange_data = await exchange_rate_service.get_usd_krw_rate(transaction_date_str)
        actual_exchange_rate = Decimal(str(exchange_data["currency"]["exchange_rate"]))
        logger.info(f"거래 날짜 {transaction_date_str} USD/KRW 환율: {actual_exchange_rate}")
      except Exception as e:
        logger.warning(f"환율 조회 실패, 기본값 사용: {str(e)}")
        actual_exchange_rate = Decimal('1400.0')  # fallback
    else:
      actual_exchange_rate = Decimal('1.0')  # 국내주식
    
    # 거래 생성 (Holdings 자동 업데이트)
    new_transaction = await transaction_crud.create_transaction(
      db=db,
      user_id=current_user.id,
      stock_id=stock.id,
      broker_id=request.broker_id,
      transaction_type=request.transaction_type,
      quantity=request.quantity,
      price=Decimal(str(request.price)),
      commission=commission,
      transaction_tax=transaction_tax,
      exchange_rate=actual_exchange_rate,
      transaction_date=request.transaction_date,
      notes=request.notes
    )
    
    broker = await broker_crud.get_broker_by_id(db, request.broker_id)
    
    return TransactionResponse(
      id=new_transaction.id,
      user_id=new_transaction.user_id,
      broker_id=new_transaction.broker_id,
      stock_id=new_transaction.stock_id,
      transaction_type=new_transaction.transaction_type,
      quantity=new_transaction.quantity,
      price=new_transaction.price,
      commission=new_transaction.commission,
      transaction_tax=new_transaction.transaction_tax,
      exchange_rate=new_transaction.exchange_rate,
      transaction_date=new_transaction.transaction_date,
      notes=new_transaction.notes,
      created_at=new_transaction.created_at,
      broker_name=broker.display_name if broker else None,
      stock_symbol=stock.symbol,
      company_name=stock.company_name
    )
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"거래 생성 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="거래 생성 중 오류가 발생했습니다.")

@router.get("/history")
async def get_trading_history(
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  내 거래 내역 전체
  """
  try:
    transactions = await transaction_crud.get_user_transactions(db, current_user.id)
    
    transaction_list = []
    for transaction in transactions:
      transaction_item = {
        "id": transaction.id,
        "stock_id": transaction.stock_id,
        "broker_id": transaction.broker_id,
        "transaction_type": transaction.transaction_type,
        "quantity": transaction.quantity,
        "price": float(transaction.price),
        "commission": float(transaction.commission),
        "transaction_tax": float(transaction.transaction_tax),
        "exchange_rate": float(transaction.exchange_rate),
        "transaction_date": transaction.transaction_date,
        "notes": transaction.notes,
        "created_at": transaction.created_at,
        "stock_symbol": transaction.stock.symbol if transaction.stock else None,
        "company_name": transaction.stock.company_name if transaction.stock else None,
        "broker_name": transaction.broker.display_name if transaction.broker else None
      }
      transaction_list.append(transaction_item)
    
    return {
      "success": True,
      "data": transaction_list,
      "total_count": len(transaction_list)
    }
    
  except Exception as e:
    logger.error(f"거래 내역 조회 중 오류: user_id={current_user.id}, error={str(e)}")
    raise HTTPException(status_code=500, detail="거래 내역 조회 중 오류가 발생했습니다.")