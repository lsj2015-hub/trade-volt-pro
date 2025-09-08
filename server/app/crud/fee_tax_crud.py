import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.broker_fee import BrokerFee

logger = logging.getLogger(__name__)

class FeeTaxCRUD:
  """수수료 계산 CRUD (개선된 버전)"""
  
  async def get_broker_fee_info(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str
  ) -> Optional[BrokerFee]:
    """증권사별 수수료 정보 조회"""
    try:
      result = await db.execute(
        select(BrokerFee).filter(
          and_(
            BrokerFee.broker_id == broker_id,
            BrokerFee.market_type == market_type,
            BrokerFee.transaction_type == transaction_type,
            BrokerFee.is_active == True
          )
        )
      )
      fee_info = result.scalar_one_or_none()
      
      if fee_info:
        logger.info(f"수수료 정보 조회 완료: broker_id={broker_id}, market_type={market_type}, transaction_type={transaction_type}")
      else:
        logger.info(f"수수료 정보 없음, 기본값 사용: broker_id={broker_id}, market_type={market_type}, transaction_type={transaction_type}")
      
      return fee_info
      
    except Exception as e:
      logger.error(f"수수료 정보 조회 실패: broker_id={broker_id}, market_type={market_type}, transaction_type={transaction_type}, error={str(e)}")
      raise
  
  async def calculate_commission(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str,
    amount: Decimal
  ) -> Decimal:
    """수수료 계산 (최소/최대 수수료 적용)"""
    try:
      fee_info = await self.get_broker_fee_info(db, broker_id, market_type, transaction_type)
      
      if not fee_info:
        # 기본 수수료율 적용 (0.015%)
        commission = amount * Decimal('0.00015')
        logger.info(f"기본 수수료율 적용: amount={amount}, commission={commission}")
      else:
        # 증권사 수수료율 적용
        commission = amount * fee_info.fee_rate
        
        # 최소 수수료 적용
        if hasattr(fee_info, 'min_commission') and fee_info.min_commission:
          commission = max(commission, fee_info.min_commission)
        
        # 최대 수수료 적용
        if hasattr(fee_info, 'max_commission') and fee_info.max_commission:
          commission = min(commission, fee_info.max_commission)
        
        logger.info(f"증권사 수수료율 적용: amount={amount}, rate={fee_info.fee_rate}, commission={commission}")
      
      return commission.quantize(Decimal('0.01'))
      
    except Exception as e:
      logger.error(f"수수료 계산 실패: broker_id={broker_id}, amount={amount}, error={str(e)}")
      raise
  
  async def calculate_tax(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str,
    amount: Decimal
  ) -> Decimal:
    """거래세 계산 (매도시에만 적용)"""
    try:
      if transaction_type.upper() != "SELL":
        logger.info(f"매수 거래로 거래세 없음: transaction_type={transaction_type}")
        return Decimal('0')
      
      fee_info = await self.get_broker_fee_info(db, broker_id, market_type, transaction_type)
      
      if not fee_info:
        # 기본 거래세율 (국내: 0.23%, 해외: 0%)
        tax_rate = Decimal('0.0023') if market_type == "DOMESTIC" else Decimal('0')
        logger.info(f"기본 거래세율 적용: market_type={market_type}, rate={tax_rate}")
      else:
        tax_rate = fee_info.transaction_tax_rate if fee_info.transaction_tax_rate else Decimal('0')
        logger.info(f"증권사 거래세율 적용: rate={tax_rate}")
      
      tax = amount * tax_rate
      return tax.quantize(Decimal('0.01'))
      
    except Exception as e:
      logger.error(f"거래세 계산 실패: broker_id={broker_id}, amount={amount}, error={str(e)}")
      raise
  
  async def calculate_total_fees(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str,
    price: Decimal,
    quantity: int
  ) -> Dict[str, Decimal]:
    """총 수수료 및 세금 계산"""
    try:
      # 입력값 검증
      if price <= 0:
        raise ValueError(f"가격은 0보다 커야 합니다: price={price}")
      if quantity <= 0:
        raise ValueError(f"수량은 0보다 커야 합니다: quantity={quantity}")
      
      amount = price * Decimal(str(quantity))
      
      # 수수료와 거래세 병렬 계산 (하지만 같은 DB 세션이므로 순차 실행)
      commission = await self.calculate_commission(
        db, broker_id, market_type, transaction_type, amount
      )
      
      tax = await self.calculate_tax(
        db, broker_id, market_type, transaction_type, amount
      )
      
      total_fees = commission + tax
      
      # 실제 거래금액 계산
      if transaction_type.upper() == "BUY":
        net_amount = amount + total_fees  # 매수: 원금 + 수수료
      else:
        net_amount = amount - total_fees  # 매도: 원금 - 수수료
      
      result = {
        "commission": commission,
        "transaction_tax": tax,
        "total_fees": total_fees,
        "gross_amount": amount,
        "net_amount": net_amount
      }
      
      logger.info(f"수수료 계산 완료: broker_id={broker_id}, market_type={market_type}, "
                 f"transaction_type={transaction_type}, amount={amount}, "
                 f"commission={commission}, tax={tax}, total_fees={total_fees}")
      
      return result
      
    except ValueError as e:
      logger.error(f"수수료 계산 입력값 오류: {str(e)}")
      raise
    except Exception as e:
      logger.error(f"총 수수료 계산 실패: broker_id={broker_id}, price={price}, quantity={quantity}, error={str(e)}")
      raise
  
  async def get_fee_schedule(
    self,
    db: AsyncSession,
    broker_id: int
  ) -> Dict[str, Any]:
    """증권사의 전체 수수료 체계 조회"""
    try:
      result = await db.execute(
        select(BrokerFee).filter(
          and_(
            BrokerFee.broker_id == broker_id,
            BrokerFee.is_active == True
          )
        ).order_by(BrokerFee.market_type, BrokerFee.transaction_type)
      )
      
      fee_schedules = result.scalars().all()
      
      # 시장타입/거래타입별로 그룹화
      schedule_dict = {}
      for fee in fee_schedules:
        key = f"{fee.market_type}_{fee.transaction_type}"
        schedule_dict[key] = {
          "market_type": fee.market_type,
          "transaction_type": fee.transaction_type,
          "fee_rate": float(fee.fee_rate),
          "transaction_tax_rate": float(fee.transaction_tax_rate) if fee.transaction_tax_rate else 0.0,
          "min_commission": float(fee.min_commission) if hasattr(fee, 'min_commission') and fee.min_commission else None,
          "max_commission": float(fee.max_commission) if hasattr(fee, 'max_commission') and fee.max_commission else None
        }
      
      logger.info(f"수수료 체계 조회 완료: broker_id={broker_id}, 항목 수={len(schedule_dict)}")
      return schedule_dict
      
    except Exception as e:
      logger.error(f"수수료 체계 조회 실패: broker_id={broker_id}, error={str(e)}")
      raise

# 싱글톤 인스턴스
fee_tax_crud = FeeTaxCRUD()