import logging
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.broker import Broker
from app.crud.base_crud import BaseCRUD

logger = logging.getLogger(__name__)

class BrokerCRUD(BaseCRUD[Broker]):
  """Broker 관련 CRUD 작업"""
  
  async def get_active_brokers_async(self, db: AsyncSession) -> List[Dict]:
    """활성화된 증권사 목록 조회 (AsyncSession)"""
    query = (
      select(Broker)
      .filter(Broker.is_active == True)
      .order_by(Broker.display_name)
    )
    
    brokers = await self._get_multiple_results(
      db, query, "증권사 목록 조회 실패"
    )
    
    broker_list = []
    for broker in brokers:
      broker_list.append({
        "id": broker.id,
        "broker_name": broker.broker_name,
        "display_name": broker.display_name
      })
    
    logger.info(f"증권사 목록 조회 완료: {len(broker_list)}개")
    return broker_list
  
  async def get_broker_by_id(self, db: AsyncSession, broker_id: int) -> Optional[Broker]:
    """ID로 증권사 조회"""
    query = select(Broker).filter(
      and_(
        Broker.id == broker_id, 
        Broker.is_active == True
      )
    )
    
    return await self._get_single_result(
      db, query, f"증권사 조회 실패: broker_id={broker_id}"
    )

  async def get_broker_by_name(self, db: AsyncSession, broker_name: str) -> Optional[Broker]:
    """이름으로 증권사 조회"""
    query = select(Broker).filter(
      and_(
        Broker.broker_name == broker_name,
        Broker.is_active == True
      )
    )
    
    return await self._get_single_result(
      db, query, f"증권사 조회 실패: broker_name={broker_name}"
    )

  async def get_all_brokers(self, db: AsyncSession) -> List[Broker]:
    """모든 증권사 조회 (활성/비활성 포함)"""
    query = select(Broker).order_by(Broker.display_name)
    
    return await self._get_multiple_results(
      db, query, "전체 증권사 목록 조회 실패"
    )

# 싱글톤 인스턴스
broker_crud = BrokerCRUD()