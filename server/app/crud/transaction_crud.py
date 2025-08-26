import logging
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, desc, func, case
from datetime import datetime
from decimal import Decimal

from app.models.transaction import Transaction
from app.models.stock import Stock
from app.models.broker import Broker

logger = logging.getLogger(__name__)

class TransactionCRUD:
  """Transaction 관련 CRUD 작업"""
  
  async def create_transaction(
    self,
    db: AsyncSession,
    user_id: int,
    stock_id: int,
    broker_id: int,
    transaction_type: str,
    quantity: int,
    price: Decimal,
    commission: Decimal,
    transaction_tax: Decimal,
    exchange_rate: Decimal,
    transaction_date: datetime,
    notes: Optional[str] = None
  ) -> Transaction:
    """
    새 거래 생성
    """
    try:
      new_transaction = Transaction(
        user_id=user_id,
        broker_id=broker_id,
        stock_id=stock_id,
        transaction_type=transaction_type,
        quantity=quantity,
        price=price,
        commission=commission,
        transaction_tax=transaction_tax,
        exchange_rate=exchange_rate,
        transaction_date=transaction_date,
        notes=notes
      )
      
      db.add(new_transaction)
      await db.commit()
      await db.refresh(new_transaction)
      
      logger.info(f"거래 생성 완료: transaction_id={new_transaction.id}, user_id={user_id}")
      return new_transaction
      
    except Exception as e:
      await db.rollback()
      logger.error(f"거래 생성 중 오류: user_id={user_id}, error={str(e)}")
      raise

  async def get_user_portfolio_summary(
    self,
    db: AsyncSession,
    user_id: int
  ) -> List[Dict]:
    """
    사용자의 포트폴리오 요약 조회 (stock_id별, broker별 합산)
    매수/매도를 고려하여 순 보유량과 평균 매입단가 계산
    """
    try:
      # stock_id, broker_id별로 그룹핑하여 집계
      result = await db.execute(
        select(
          Transaction.stock_id,
          Transaction.broker_id,
          Stock.symbol.label('stock_symbol'),
          Stock.company_name,
          Stock.company_name_en,
          Stock.currency,
          Stock.country_code,
          Broker.display_name.label('broker_name'),
          # 매수량 - 매도량 = 순 보유량
          func.sum(
            case(
              (Transaction.transaction_type == 'BUY', Transaction.quantity),
              else_=-Transaction.quantity
            )
          ).label('net_quantity'),
          # 매수 총액 (가격 * 수량 + 수수료)
          func.sum(
            case(
              (Transaction.transaction_type == 'BUY', 
               Transaction.quantity * Transaction.price + Transaction.commission + Transaction.transaction_tax),
              else_=0
            )
          ).label('total_buy_amount'),
          # 매도 총액 (가격 * 수량 - 수수료)  
          func.sum(
            case(
              (Transaction.transaction_type == 'SELL',
               Transaction.quantity * Transaction.price - Transaction.commission - Transaction.transaction_tax),
              else_=0
            )
          ).label('total_sell_amount'),
          # 매수한 총 수량
          func.sum(
            case(
              (Transaction.transaction_type == 'BUY', Transaction.quantity),
              else_=0
            )
          ).label('total_buy_quantity')
        )
        .join(Stock, Transaction.stock_id == Stock.id)
        .join(Broker, Transaction.broker_id == Broker.id)
        .filter(Transaction.user_id == user_id)
        .group_by(
          Transaction.stock_id, 
          Transaction.broker_id,
          Stock.symbol,
          Stock.company_name, 
          Stock.company_name_en,
          Stock.currency,
          Stock.country_code,
          Broker.display_name
        )
        .having(func.sum(
          case(
            (Transaction.transaction_type == 'BUY', Transaction.quantity),
            else_=-Transaction.quantity
          )
        ) > 0)  # 순 보유량이 0보다 큰 것만
      )
      
      portfolio_data = []
      for row in result:
        net_quantity = float(row.net_quantity or 0)
        total_buy_amount = float(row.total_buy_amount or 0)
        total_buy_quantity = float(row.total_buy_quantity or 0)
        
        # 평균 매입단가 계산 (매수한 총 금액 / 매수한 총 수량)
        avg_cost_price = total_buy_amount / total_buy_quantity if total_buy_quantity > 0 else 0
        
        # 현재 보유 종목만 포함 (순 보유량 > 0)
        if net_quantity > 0:
          market_type = "DOMESTIC" if row.country_code == "KR" else "OVERSEAS"
          
          portfolio_item = {
            "stock_id": row.stock_id,
            "broker_id": row.broker_id,
            "stock_symbol": row.stock_symbol,
            "company_name": row.company_name,
            "company_name_en": row.company_name_en or "",
            "broker_name": row.broker_name,
            "total_quantity": int(net_quantity),
            "total_cost_amount": total_buy_amount,
            "average_cost_price": avg_cost_price,
            "market_type": market_type,
            "currency": row.currency
          }
          portfolio_data.append(portfolio_item)
      
      logger.info(f"포트폴리오 요약 조회 완료: user_id={user_id}, 보유 종목 수={len(portfolio_data)}")
      return portfolio_data
      
    except Exception as e:
      logger.error(f"포트폴리오 요약 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise
  
  async def get_user_transactions(
    self,
    db: AsyncSession,
    user_id: int,
  ) -> List[Transaction]:
    """
    사용자의 거래 목록 조회
    """
    try:
      result = await db.execute(
        select(Transaction)
        .options(
          joinedload(Transaction.stock),
          joinedload(Transaction.broker)
        )
        .filter(Transaction.user_id == user_id)
        .order_by(desc(Transaction.transaction_date))
      )
      return result.scalars().all()
      
    except Exception as e:
      logger.error(f"사용자 거래 목록 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise
  
  async def get_stock_by_symbol(
    self,
    db: AsyncSession,
    symbol: str
  ) -> Optional[Stock]:
    """
    심볼로 종목 조회
    """
    try:
      result = await db.execute(
        select(Stock).filter(Stock.symbol == symbol, Stock.is_active == True)
      )
      return result.scalar_one_or_none()
      
    except Exception as e:
      logger.error(f"종목 조회 중 오류: symbol={symbol}, error={str(e)}")
      raise

# 싱글톤 인스턴스
transaction_crud = TransactionCRUD()