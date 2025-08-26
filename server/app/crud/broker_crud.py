import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.broker import Broker

logger = logging.getLogger(__name__)

class BrokerCRUD:
  """Broker 관련 CRUD 작업"""
  
  async def get_active_brokers_async(self, db: AsyncSession) -> List[Dict]:
    """
    활성화된 증권사 목록 조회 (AsyncSession)
    """
    try:
      result = await db.execute(
        select(Broker).filter(Broker.is_active == True).order_by(Broker.display_name)
      )
      brokers = result.scalars().all()
      
      broker_list = []
      for broker in brokers:
        broker_list.append({
          "id": broker.id,
          "broker_name": broker.broker_name,
          "display_name": broker.display_name
        })
      
      logger.info(f"증권사 목록 조회 완료: {len(broker_list)}개")
      return broker_list
      
    except Exception as e:
      logger.error(f"증권사 목록 조회 중 오류: {str(e)}")
      raise
  
  def get_active_brokers_sync(self, db: Session) -> List[Dict]:
    """
    활성화된 증권사 목록 조회 (Session)
    """
    try:
      brokers = db.query(Broker).filter(Broker.is_active == True).order_by(Broker.display_name).all()
      
      broker_list = []
      for broker in brokers:
        broker_list.append({
          "id": broker.id,
          "broker_name": broker.broker_name,
          "display_name": broker.display_name
        })
      
      logger.info(f"증권사 목록 조회 완료: {len(broker_list)}개")
      return broker_list
      
    except Exception as e:
      logger.error(f"증권사 목록 조회 중 오류: {str(e)}")
      raise
  
  async def get_broker_by_id(self, db: AsyncSession, broker_id: int) -> Optional[Broker]:
    """
    ID로 증권사 조회
    """
    try:
      result = await db.execute(
        select(Broker).filter(Broker.id == broker_id, Broker.is_active == True)
      )
      return result.scalar_one_or_none()
      
    except Exception as e:
      logger.error(f"증권사 조회 중 오류: broker_id={broker_id}, error={str(e)}")
      raise

# 싱글톤 인스턴스
broker_crud = BrokerCRUD()