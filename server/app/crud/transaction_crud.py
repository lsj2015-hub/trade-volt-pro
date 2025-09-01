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
from app.crud.holding_crud import holding_crud
from app.models.holding import Holding


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
      # Holdings 정보를 먼저 가져와서 매도 시 평균단가 계산
      holding = await holding_crud.get_or_create_holding(db, user_id, stock_id, broker_id)

      # 매도인 경우 실현손익 계산을 위한 추가 필드 설정
      avg_cost_at_transaction = None
      realized_profit_per_share = None
      total_realized_profit = None

      if transaction_type == 'SELL':
        if holding.quantity >= quantity:  # 매도 가능한 수량 체크
          # 매도 시점의 평균단가 (이미 수수료 포함됨)
          avg_cost_at_transaction = holding.average_cost
          
          # 매도 순수익 = 매도가 - 매도 시 수수료/세금
          sell_proceeds_per_share = price - (commission + transaction_tax) / quantity
          
          # 실현 수익 = 매도 순수익 - 수수료 포함 평균단가
          realized_profit_per_share = sell_proceeds_per_share - avg_cost_at_transaction
          
          # 총 실현손익
          total_realized_profit = realized_profit_per_share * quantity
        else:
          raise ValueError(f"보유 수량 부족: 보유={holding.quantity}, 매도시도={quantity}")

      # 거래 기록 생성 (추가 필드 포함)
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
        notes=notes,
        avg_cost_at_transaction=avg_cost_at_transaction,
        realized_profit_per_share=realized_profit_per_share,
        total_realized_profit=total_realized_profit
      )
      
      db.add(new_transaction)
      await db.flush()  # Transaction ID 생성
      
      # Holdings 테이블 업데이트 (holding은 이미 위에서 조회했으므로 재사용)
      if transaction_type == 'BUY':
        await holding_crud.update_holding_for_buy(
          holding, quantity, price, commission, transaction_tax, transaction_date, exchange_rate
        )
      elif transaction_type == 'SELL':
        await holding_crud.update_holding_for_sell(
          holding, quantity, price, commission, transaction_tax, 
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

  async def get_realized_profits_db(
    self,
    db: AsyncSession,
    user_id: int,
    market_type: Optional[str] = None,
    broker_id: Optional[int] = None,
    stock_symbol: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
  ) -> List[Dict]:
    """
    실현손익 Raw 데이터 조회 (순수 DB 작업만)
    """
    try:
      # 기본 쿼리 - 매도 거래만
      query = select(
        Transaction.id,
        Transaction.transaction_date,
        Transaction.quantity,
        Transaction.price,
        Transaction.commission,
        Transaction.transaction_tax,
        Transaction.avg_cost_at_transaction,
        Transaction.realized_profit_per_share,
        Transaction.total_realized_profit,
        Transaction.exchange_rate,
        Stock.symbol,
        Stock.company_name,
        Stock.company_name_en,
        Stock.currency,
        Stock.country_code,
        Broker.display_name.label('broker_name'),
        Broker.id.label('broker_id')
      ).join(Stock, Transaction.stock_id == Stock.id).join(Broker, Transaction.broker_id == Broker.id).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'SELL',
        Transaction.total_realized_profit.isnot(None)
      )
      
      # 필터 적용
      if market_type == 'DOMESTIC':
        query = query.filter(Stock.country_code == 'KR')
      elif market_type == 'OVERSEAS':
        query = query.filter(Stock.country_code != 'KR')
      
      if broker_id:
        query = query.filter(Transaction.broker_id == broker_id)
      
      if stock_symbol:
        query = query.filter(Stock.symbol == stock_symbol)
      
      if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
      
      if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
      
      query = query.order_by(desc(Transaction.transaction_date))
      
      result = await db.execute(query)
      return [dict(row._mapping) for row in result]
      
    except Exception as e:
      logger.error(f"실현손익 Raw 데이터 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise

  async def get_realized_profits_metadata(
  self,
  db: AsyncSession,
  user_id: int
  ) -> Dict:
    """실현손익 관련 메타데이터 조회"""
    try:
      # 실현손익이 있는 종목 목록 조회
      stock_query = select(
        Stock.symbol,
        Stock.company_name,
        Stock.company_name_en
      ).join(Transaction, Stock.id == Transaction.stock_id).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'SELL',
        Transaction.total_realized_profit.isnot(None)
      ).distinct().order_by(Stock.symbol)
      
      # 실현손익 거래가 있는 증권사 목록 조회
      broker_query = select(
        Broker.id,
        Broker.name,
        Broker.display_name
      ).join(Transaction, Broker.id == Transaction.broker_id).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'SELL',
        Transaction.total_realized_profit.isnot(None)
      ).distinct().order_by(Broker.display_name)
      
      stock_result = await db.execute(stock_query)
      broker_result = await db.execute(broker_query)
      
      # 종목 목록 가공
      stocks = []
      for row in stock_result:
        stocks.append({
          "symbol": row.symbol,
          "companyName": row.company_name,
          "companyNameEn": row.company_name_en or ""
        })
      
      # 증권사 목록 가공
      brokers = []
      for row in broker_result:
        brokers.append({
          "id": row.id,
          "name": row.name,
          "displayName": row.display_name
        })
      
      return {
        "stocks": stocks,
        "brokers": brokers
      }
      
    except Exception as e:
      logger.error(f"실현손익 메타데이터 조회 오류: user_id={user_id}, error={str(e)}")
      return {"stocks": [], "brokers": []}

# 싱글톤 인스턴스
transaction_crud = TransactionCRUD()