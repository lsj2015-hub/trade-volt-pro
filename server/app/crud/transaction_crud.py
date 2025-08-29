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
    새 거래 생성 및 Holdings 테이블 업데이트
    """
    try:
      # 거래 기록 생성
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
      await db.flush()  # Transaction ID 생성
      
      # Holdings 테이블 업데이트
      from app.crud.holding_crud import holding_crud
      
      holding = await holding_crud.get_or_create_holding(db, user_id, stock_id, broker_id)
      
      if transaction_type == 'BUY':
        await holding_crud.update_holding_for_buy(
          db, holding, quantity, price, commission, transaction_tax, transaction_date
        )
      elif transaction_type == 'SELL':
        await holding_crud.update_holding_for_sell(
          db, holding, quantity, price, commission, transaction_tax, 
          transaction_date, exchange_rate
        )
      
      await db.commit()
      await db.refresh(new_transaction)
      
      logger.info(f"거래 생성 및 Holdings 업데이트 완료: transaction_id={new_transaction.id}")
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
    사용자의 포트폴리오 요약 조회 (Holdings 테이블 기반)
    """
    try:
      from app.models.holding import Holding
      from app.models.stock import Stock
      from app.models.broker import Broker
      
      result = await db.execute(
        select(
          Holding.stock_id,
          Holding.broker_id,
          Stock.symbol.label('stock_symbol'),
          Stock.company_name,
          Stock.company_name_en,
          Stock.currency,
          Stock.country_code,
          Broker.display_name.label('broker_name'),
          Holding.quantity.label('total_quantity'),
          Holding.average_cost.label('average_cost_price'),
          Holding.total_cost.label('total_cost_amount'),
          Holding.realized_gain,
          Holding.realized_gain_krw,
          Holding.first_purchase_date,
          Holding.last_transaction_date
        )
        .join(Stock, Holding.stock_id == Stock.id)
        .join(Broker, Holding.broker_id == Broker.id)
        .filter(
          Holding.user_id == user_id,
          Holding.is_active == True,
          Holding.quantity > 0
        )
        .order_by(Holding.last_transaction_date.desc())
      )
      
      portfolio_data = []
      for row in result:
        market_type = "DOMESTIC" if row.country_code == "KR" else "OVERSEAS"
        
        portfolio_item = {
          "stock_id": row.stock_id,
          "broker_id": row.broker_id,
          "stock_symbol": row.stock_symbol,
          "company_name": row.company_name,
          "company_name_en": row.company_name_en or "",
          "broker_name": row.broker_name,
          "total_quantity": int(row.total_quantity),
          "total_cost_amount": float(row.total_cost_amount),
          "average_cost_price": float(row.average_cost_price),
          "realized_gain": float(row.realized_gain),
          "realized_gain_krw": float(row.realized_gain_krw),
          "market_type": market_type,
          "currency": row.currency,
          "first_purchase_date": row.first_purchase_date,
          "last_transaction_date": row.last_transaction_date
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

  async def get_stock_holdings_summary(
    self,
    db: AsyncSession,
    user_id: int,
    stock_symbol: str
  ):
    """
    특정 종목의 broker별 보유현황 조회 (Holdings 테이블 기반)
    """
    try:
      from app.models.holding import Holding
      from app.models.stock import Stock
      from app.models.broker import Broker
      
      result = await db.execute(
        select(
          Holding.broker_id,
          Broker.display_name.label('broker_name'),
          Holding.quantity.label('net_quantity'),
          Holding.average_cost.label('average_cost_price'),
          Holding.total_cost,
          Holding.realized_gain,
          Holding.realized_gain_krw,
          Holding.last_transaction_date.label('latest_transaction_date')
        )
        .join(Stock, Holding.stock_id == Stock.id)
        .join(Broker, Holding.broker_id == Broker.id)
        .filter(
          Holding.user_id == user_id,
          Stock.symbol == stock_symbol,
          Holding.is_active == True,
          Holding.quantity > 0
        )
        .order_by(Holding.last_transaction_date.desc())
      )
      
      lots = []
      for row in result:
        lots.append({
          "broker_id": row.broker_id,
          "broker_name": row.broker_name,
          "net_quantity": int(row.net_quantity),
          "average_cost_price": float(row.average_cost_price),
          "total_cost": float(row.total_cost),
          "realized_gain": float(row.realized_gain),
          "realized_gain_krw": float(row.realized_gain_krw),
          "latest_transaction_date": row.latest_transaction_date
        })
      
      return lots
      
    except Exception as e:
      logger.error(f"종목별 broker 보유현황 조회 중 오류: user_id={user_id}, stock_symbol={stock_symbol}, error={str(e)}")
      raise

  # 기존 메서드는 deprecated로 유지 (호환성을 위해)
  async def get_broker_holdings_per_stock(
    self, 
    db: AsyncSession, 
    user_id: int, 
    stock_symbol: str
  ):
    """
    broker별 종목 집계 (기존 방식 - deprecated)
    새로운 get_stock_holdings_summary 사용 권장
    """
    logger.warning("get_broker_holdings_per_stock는 deprecated입니다. get_stock_holdings_summary를 사용하세요.")
    return await self.get_stock_holdings_summary(db, user_id, stock_symbol)

# 싱글톤 인스턴스
transaction_crud = TransactionCRUD()