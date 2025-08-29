import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from decimal import Decimal

from app.models.holding import Holding

logger = logging.getLogger(__name__)

class HoldingCRUD:
  """Holding 관련 CRUD 작업"""
  
  async def get_or_create_holding(
    self,
    db: AsyncSession,
    user_id: int,
    stock_id: int,
    broker_id: int
  ) -> Holding:
    """
    사용자-종목-브로커 보유 정보 조회 또는 생성
    """
    try:
      # 기존 보유 정보 조회
      result = await db.execute(
        select(Holding).filter(
          Holding.user_id == user_id,
          Holding.stock_id == stock_id,
          Holding.broker_id == broker_id
        )
      )
      holding = result.scalar_one_or_none()
      
      if not holding:
        # 새로운 보유 정보 생성 (초기값)
        holding = Holding(
          user_id=user_id,
          stock_id=stock_id,
          broker_id=broker_id,
          quantity=0,
          average_cost=Decimal('0'),
          total_cost=Decimal('0'),
          realized_gain=Decimal('0'),
          realized_gain_krw=Decimal('0'),
          first_purchase_date=date.today(),  # 첫 매수 시 업데이트
          last_transaction_date=datetime.now(),
          is_active=False
        )
        db.add(holding)
        await db.flush()  # ID 생성을 위해 flush
      
      return holding
      
    except Exception as e:
      logger.error(f"보유 정보 조회/생성 중 오류: user_id={user_id}, stock_id={stock_id}, broker_id={broker_id}, error={str(e)}")
      raise

  async def update_holding_for_buy(
    self,
    db: AsyncSession,
    holding: Holding,
    quantity: int,
    price: Decimal,
    commission: Decimal,
    transaction_tax: Decimal,
    transaction_date: datetime
  ) -> Holding:
    """
    매수 거래 시 보유 정보 업데이트
    """
    try:
      # 매수 총 비용 (가격 * 수량 + 수수료 + 세금)
      buy_cost = quantity * price + commission + transaction_tax
      
      if holding.quantity == 0:
        # 첫 매수인 경우
        holding.quantity = quantity
        holding.average_cost = price + (commission + transaction_tax) / quantity
        holding.total_cost = buy_cost
        holding.first_purchase_date = transaction_date.date()
        holding.is_active = True
      else:
        # 추가 매수인 경우 - 가중평균 계산
        total_quantity = holding.quantity + quantity
        total_cost = holding.total_cost + buy_cost
        
        holding.quantity = total_quantity
        holding.total_cost = total_cost
        holding.average_cost = total_cost / total_quantity
      
      holding.last_transaction_date = transaction_date
      
      logger.info(f"매수 후 보유 정보 업데이트 완료: user_id={holding.user_id}, stock_id={holding.stock_id}, broker_id={holding.broker_id}, quantity={holding.quantity}, avg_cost={holding.average_cost}")
      return holding
      
    except Exception as e:
      logger.error(f"매수 보유 정보 업데이트 중 오류: error={str(e)}")
      raise

  async def update_holding_for_sell(
    self,
    db: AsyncSession,
    holding: Holding,
    quantity: int,
    price: Decimal,
    commission: Decimal,
    transaction_tax: Decimal,
    transaction_date: datetime,
    exchange_rate: Decimal = Decimal('1.0')
  ) -> Holding:
    """
    매도 거래 시 보유 정보 업데이트
    """
    try:
      if holding.quantity < quantity:
        raise ValueError(f"보유 수량 부족: 보유={holding.quantity}, 매도시도={quantity}")
      
      # 매도 수익 (가격 * 수량 - 수수료 - 세금)
      sell_proceeds = quantity * price - commission - transaction_tax
      
      # 매도한 부분의 원가 (평균단가 기준)
      sold_cost = holding.average_cost * quantity
      
      # 실현 손익 계산
      realized_gain = sell_proceeds - sold_cost
      realized_gain_krw = realized_gain * exchange_rate
      
      # 보유 정보 업데이트
      holding.quantity -= quantity
      holding.total_cost -= sold_cost  # 매도한 부분의 원가 차감
      holding.realized_gain += realized_gain
      holding.realized_gain_krw += realized_gain_krw
      holding.last_transaction_date = transaction_date
      
      # 평균단가는 변하지 않음 (매도 시)
      # 전량 매도인 경우
      if holding.quantity == 0:
        holding.is_active = False
        holding.average_cost = Decimal('0')
        holding.total_cost = Decimal('0')
      
      logger.info(f"매도 후 보유 정보 업데이트 완료: user_id={holding.user_id}, stock_id={holding.stock_id}, broker_id={holding.broker_id}, quantity={holding.quantity}, realized_gain={realized_gain}")
      return holding
      
    except Exception as e:
      logger.error(f"매도 보유 정보 업데이트 중 오류: error={str(e)}")
      raise

  async def get_active_holdings(
    self,
    db: AsyncSession,
    user_id: int
  ):
    """
    사용자의 활성 보유 종목 조회
    """
    try:
      result = await db.execute(
        select(Holding).filter(
          Holding.user_id == user_id,
          Holding.is_active == True,
          Holding.quantity > 0
        ).order_by(Holding.last_transaction_date.desc())
      )
      return result.scalars().all()
      
    except Exception as e:
      logger.error(f"활성 보유 종목 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise

  async def get_user_portfolio_by_stocks(
    self,
    db: AsyncSession,
    user_id: int
  ):
    """
    사용자의 종목별 포트폴리오 요약 (모든 broker 합산)
    - Apple: 총 35주, 평균단가 $107.14, 3개 broker에서 보유
    """
    try:
      from app.models.stock import Stock
      
      result = await db.execute(
        select(
          Holding.stock_id,
          Stock.symbol.label('stock_symbol'),
          Stock.company_name,
          Stock.company_name_en,
          Stock.currency,
          Stock.country_code,
          func.count(Holding.broker_id).label('broker_count'),  # 몇 개 broker에서 보유 중
          func.sum(Holding.quantity).label('total_quantity'),
          func.sum(Holding.total_cost).label('total_investment'),
          func.sum(Holding.realized_gain).label('total_realized_gain'),
          func.sum(Holding.realized_gain_krw).label('total_realized_gain_krw'),
          func.min(Holding.first_purchase_date).label('first_purchase_date'),
          func.max(Holding.last_transaction_date).label('latest_transaction_date'),
          # 전체 평균단가 = 총 투자금액 / 총 보유수량
          (func.sum(Holding.total_cost) / func.sum(Holding.quantity)).label('overall_average_cost')
        )
        .join(Stock, Holding.stock_id == Stock.id)
        .filter(
          Holding.user_id == user_id,
          Holding.is_active == True,
          Holding.quantity > 0
        )
        .group_by(
          Holding.stock_id,
          Stock.symbol,
          Stock.company_name,
          Stock.company_name_en,
          Stock.currency,
          Stock.country_code
        )
        .order_by(func.max(Holding.last_transaction_date).desc())
      )
      
      portfolio_summary = []
      for row in result:
        market_type = "DOMESTIC" if row.country_code == "KR" else "OVERSEAS"
        
        summary_item = {
          "stock_id": row.stock_id,
          "stock_symbol": row.stock_symbol,
          "company_name": row.company_name,
          "company_name_en": row.company_name_en or "",
          "currency": row.currency,
          "market_type": market_type,
          "broker_count": row.broker_count,
          "total_quantity": int(row.total_quantity),
          "total_investment": float(row.total_investment),
          "overall_average_cost": float(row.overall_average_cost),
          "total_realized_gain": float(row.total_realized_gain),
          "total_realized_gain_krw": float(row.total_realized_gain_krw),
          "first_purchase_date": row.first_purchase_date,
          "latest_transaction_date": row.latest_transaction_date
        }
        portfolio_summary.append(summary_item)
      
      logger.info(f"종목별 포트폴리오 요약 조회 완료: user_id={user_id}, 종목 수={len(portfolio_summary)}")
      return portfolio_summary
      
    except Exception as e:
      logger.error(f"종목별 포트폴리오 요약 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise

  async def get_stock_holdings_by_brokers(
    self,
    db: AsyncSession,
    user_id: int,
    stock_id: int
  ):
    """
    특정 종목의 broker별 상세 보유현황
    - Apple in 키움: 15주 @$110
    - Apple in 한투: 20주 @$105  
    """
    try:
      from app.models.stock import Stock
      from app.models.broker import Broker
      
      result = await db.execute(
        select(
          Holding.broker_id,
          Broker.display_name.label('broker_name'),
          Holding.quantity,
          Holding.average_cost,
          Holding.total_cost,
          Holding.realized_gain,
          Holding.realized_gain_krw,
          Holding.first_purchase_date,
          Holding.last_transaction_date,
          Stock.symbol.label('stock_symbol'),
          Stock.company_name,
          Stock.currency
        )
        .join(Broker, Holding.broker_id == Broker.id)
        .join(Stock, Holding.stock_id == Stock.id)
        .filter(
          Holding.user_id == user_id,
          Holding.stock_id == stock_id,
          Holding.is_active == True,
          Holding.quantity > 0
        )
        .order_by(Holding.last_transaction_date.desc())
      )
      
      broker_details = []
      total_quantity = 0
      total_cost = 0
      total_realized_gain = 0
      total_realized_gain_krw = 0
      
      for row in result:
        detail_item = {
          "broker_id": row.broker_id,
          "broker_name": row.broker_name,
          "quantity": int(row.quantity),
          "average_cost": float(row.average_cost),
          "total_cost": float(row.total_cost),
          "realized_gain": float(row.realized_gain),
          "realized_gain_krw": float(row.realized_gain_krw),
          "first_purchase_date": row.first_purchase_date,
          "last_transaction_date": row.last_transaction_date,
          "stock_symbol": row.stock_symbol,
          "company_name": row.company_name, 
          "currency": row.currency
        }
        broker_details.append(detail_item)
        
        # 합계 계산
        total_quantity += row.quantity
        total_cost += float(row.total_cost)
        total_realized_gain += float(row.realized_gain)
        total_realized_gain_krw += float(row.realized_gain_krw)
      
      # 전체 평균단가 계산
      overall_average_cost = total_cost / total_quantity if total_quantity > 0 else 0
      
      return {
        "stock_id": stock_id,
        "stock_symbol": broker_details[0]["stock_symbol"] if broker_details else "",
        "company_name": broker_details[0]["company_name"] if broker_details else "",
        "currency": broker_details[0]["currency"] if broker_details else "",
        "broker_details": broker_details,
        "summary": {
          "total_quantity": total_quantity,
          "total_cost": total_cost,
          "overall_average_cost": overall_average_cost,
          "total_realized_gain": total_realized_gain,
          "total_realized_gain_krw": total_realized_gain_krw,
          "broker_count": len(broker_details)
        }
      }
      
    except Exception as e:
      logger.error(f"종목별 상세 보유현황 조회 중 오류: user_id={user_id}, stock_id={stock_id}, error={str(e)}")
      raise

  async def get_user_portfolio_overview(
    self,
    db: AsyncSession,
    user_id: int
  ):
    """
    전체 포트폴리오 통계
    """
    try:
      result = await db.execute(
        select(
          func.count(func.distinct(Holding.stock_id)).label('total_stocks'),
          func.count(func.distinct(Holding.broker_id)).label('total_brokers'),
          func.sum(Holding.total_cost).label('total_investment_krw'),
          func.sum(Holding.realized_gain_krw).label('total_realized_gain_krw'),
          func.count(Holding.id).label('total_positions')
        )
        .filter(
          Holding.user_id == user_id,
          Holding.is_active == True,
          Holding.quantity > 0
        )
      )
      
      row = result.first()
      
      return {
        "total_stocks": row.total_stocks or 0,
        "total_brokers": row.total_brokers or 0,
        "total_investment_krw": float(row.total_investment_krw or 0),
        "total_realized_gain_krw": float(row.total_realized_gain_krw or 0),
        "total_positions": row.total_positions or 0
      }
      
    except Exception as e:
      logger.error(f"전체 포트폴리오 통계 조회 중 오류: user_id={user_id}, error={str(e)}")
      raise

# 싱글톤 인스턴스
holding_crud = HoldingCRUD()