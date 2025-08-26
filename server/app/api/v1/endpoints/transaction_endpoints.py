from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from typing import List 
import logging
from decimal import Decimal

from app.config.database import get_async_session, get_sync_session
from app.crud.broker_crud import broker_crud
from app.crud.fee_tax_crud import fee_tax_crud
from app.crud.transaction_crud import transaction_crud
from app.models.user import User
from app.schemas.common_schema import (
  TransactionCreateRequest, TransactionResponse, BrokerResponse, CommissionRateResponse,
  PortfolioHoldingResponse, PortfolioSummaryResponse 
)
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/create-transaction", response_model=TransactionResponse)
async def create_transaction(
  request: TransactionCreateRequest,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  새 거래 생성
  """
  try:
    # 종목 정보 조회
    stock = await transaction_crud.get_stock_by_symbol(db, request.symbol)
    
    if not stock:
      raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다.")
    
    # 수수료가 제공되지 않은 경우 계산
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
    
    # 새 거래 생성
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
      exchange_rate=Decimal(str(request.exchange_rate or 1.0)),
      transaction_date=request.transaction_date,
      notes=request.notes
    )
    
    # 관계 데이터 조회
    broker = await broker_crud.get_broker_by_id(db, request.broker_id)
    
    # 응답 생성
    response_data = TransactionResponse(
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
    
    logger.info(f"거래 생성 완료: user_id={current_user.id}, transaction_id={new_transaction.id}")
    return response_data
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"거래 생성 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="거래 생성 중 오류가 발생했습니다.")
  
@router.get("/brokers", response_model=List[BrokerResponse])
async def get_brokers(
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """
  활성화된 증권사 목록 조회
  """
  try:
    brokers = broker_crud.get_active_brokers_sync(db)
    
    logger.info(f"증권사 목록 조회: user_id={current_user.id}, count={len(brokers)}")
    return brokers
    
  except Exception as e:
    logger.error(f"증권사 목록 조회 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="증권사 목록을 불러올 수 없습니다.")
  
@router.get("/commission-rate", response_model=CommissionRateResponse)
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
      # 기본 수수료율 반환
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
  
@router.get("/", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary(
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_async_session)
):
  """
  사용자의 포트폴리오 요약 조회 (stock_id별, broker별 합산)
  - 총 보유수량 (매수량 - 매도량)
  - 총 매입금액 (매수금액 + 수수료)
  - 평균 매입단가 (매입금액 / 보유수량)
  """
  try:
    portfolio_data = await transaction_crud.get_user_portfolio_summary(db, current_user.id)
    
    # PortfolioHoldingResponse 형태로 변환
    holdings = []
    for item in portfolio_data:
      holding = PortfolioHoldingResponse(
        stock_id=item["stock_id"],
        broker_id=item["broker_id"],
        stock_symbol=item["stock_symbol"],
        company_name=item["company_name"],
        company_name_en=item["company_name_en"],
        broker_name=item["broker_name"],
        total_quantity=item["total_quantity"],
        total_cost_amount=item["total_cost_amount"],
        average_cost_price=item["average_cost_price"],
        market_type=item["market_type"],
        currency=item["currency"]
      )
      holdings.append(holding)
    
    logger.info(f"포트폴리오 요약 조회: user_id={current_user.id}, 보유 종목 수={len(holdings)}")
    
    return PortfolioSummaryResponse(
      holdings=holdings,
      total_holdings_count=len(holdings)
    )
    
  except Exception as e:
    logger.error(f"포트폴리오 요약 조회 중 오류: {str(e)}")
    raise HTTPException(status_code=500, detail="포트폴리오 조회 실패")