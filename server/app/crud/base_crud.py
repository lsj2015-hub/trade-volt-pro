from typing import List, Optional, Dict, Any, TypeVar, Generic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase
import logging

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=DeclarativeBase)

class BaseCRUD(Generic[ModelType]):
  """공통 CRUD 패턴 기본 클래스"""
  
  async def _execute_query(
    self, 
    db: AsyncSession, 
    query,
    error_msg: str
  ):
    """공통 쿼리 실행 및 에러 처리"""
    try:
      result = await db.execute(query)
      return result
    except Exception as e:
      logger.error(f"{error_msg}: {str(e)}")
      raise
  
  async def _get_single_result(
    self,
    db: AsyncSession,
    query,
    error_msg: str
  ) -> Optional[ModelType]:
    """단일 결과 조회"""
    result = await self._execute_query(db, query, error_msg)
    return result.scalar_one_or_none()
  
  async def _get_multiple_results(
    self,
    db: AsyncSession, 
    query,
    error_msg: str
  ) -> List[ModelType]:
    """다중 결과 조회"""
    result = await self._execute_query(db, query, error_msg)
    scalars = result.scalars()
    return scalars.all()
  
  async def _get_mapped_results(
    self,
    db: AsyncSession,
    query,
    error_msg: str
  ) -> List[Dict[str, Any]]:
    """매핑된 결과 조회 (집계 쿼리용)"""
    result = await self._execute_query(db, query, error_msg)
    return [dict(row._mapping) for row in result]