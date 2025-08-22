from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.token_blacklist import TokenBlacklist
from app.core.security import verify_token
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM


class TokenService:
  """JWT 토큰 관리 서비스"""
  
  async def blacklist_token(self, db: AsyncSession, token: str, user_email: str) -> bool:
    """토큰을 블랙리스트에 추가"""
    try:
      # JWT에서 만료 시간 추출
      payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      expires_at = datetime.fromtimestamp(payload.get("exp"))
      
      # 블랙리스트에 추가
      blacklisted_token = TokenBlacklist(
        token=token,
        user_email=user_email,
        expires_at=expires_at
      )
      
      db.add(blacklisted_token)
      await db.commit()
      return True
      
    except JWTError:
      return False
  
  async def is_token_blacklisted(self, db: AsyncSession, token: str) -> bool:
    """토큰이 블랙리스트에 있는지 확인"""
    result = await db.execute(
      select(TokenBlacklist).filter(TokenBlacklist.token == token)
    )
    return result.scalar_one_or_none() is not None
  
  async def cleanup_expired_tokens(self, db: AsyncSession):
    """만료된 블랙리스트 토큰 정리 (배치 작업용)"""
    await db.execute(
      delete(TokenBlacklist).filter(TokenBlacklist.expires_at < datetime.utcnow())
    )
    await db.commit()


# 싱글톤 인스턴스
token_service = TokenService()