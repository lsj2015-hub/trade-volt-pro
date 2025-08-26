from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.broker_fee import BrokerFee

class FeeTaxCRUD:
  """수수료 계산 CRUD (새로운 BrokerFee 구조에 맞춤)"""
  
  async def get_broker_fee_info(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str
  ) -> Optional[BrokerFee]:
    """증권사별 수수료 정보 조회"""
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
    return result.scalar_one_or_none()
  
  async def calculate_commission(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str,  # "BUY" or "SELL"
    amount: Decimal
  ) -> Decimal:
    """수수료 계산"""
    fee_info = await self.get_broker_fee_info(db, broker_id, market_type, transaction_type)
    
    if not fee_info:
      # 기본 수수료율 적용 (0.015%)
      return amount * Decimal('0.00015')
    
    # 수수료 계산
    commission = amount * fee_info.fee_rate
    return commission.quantize(Decimal('0.01'))
  
  async def calculate_tax(
    self,
    db: AsyncSession,
    broker_id: int,
    market_type: str,
    transaction_type: str,
    amount: Decimal
  ) -> Decimal:
    """거래세 계산 (매도시에만 적용)"""
    if transaction_type.upper() != "SELL":
      return Decimal('0')
    
    fee_info = await self.get_broker_fee_info(db, broker_id, market_type, transaction_type)
    
    if not fee_info:
      # 기본 거래세율 (국내: 0.23%)
      tax_rate = Decimal('0.0023') if market_type == "DOMESTIC" else Decimal('0')
    else:
      tax_rate = fee_info.transaction_tax_rate
    
    tax = amount * tax_rate
    return tax.quantize(Decimal('0.01'))
  
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
    amount = price * Decimal(str(quantity))
    
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
    
    return {
      "commission": commission,
      "transaction_tax": tax,
      "total_fees": total_fees,
      "gross_amount": amount,
      "net_amount": net_amount
    }

# 싱글톤 인스턴스
fee_tax_crud = FeeTaxCRUD()