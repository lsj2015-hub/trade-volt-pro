from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config.settings import get_settings

# 설정에서 값 가져오기
settings = get_settings()

# 비밀번호 해싱을 위한 bcrypt 컨텍스트 설정
# bcrypt: 안전한 단방향 해싱 알고리즘
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT(JSON Web Token) 설정 - 환경변수에서 가져옴
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes


def verify_password(plain_password: str, hashed_password: str) -> bool:
  """
  사용자가 입력한 평문 비밀번호와 저장된 해시를 비교하여 검증
  
  Args:
    plain_password: 사용자가 입력한 평문 비밀번호
    hashed_password: 데이터베이스에 저장된 해싱된 비밀번호
    
  Returns:
    bool: 비밀번호 일치 여부
  """
  return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
  """
  평문 비밀번호를 bcrypt로 해싱
  
  Args:
    password: 평문 비밀번호
    
  Returns:
    str: bcrypt로 해싱된 비밀번호
  """
  return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  """
  JWT 액세스 토큰 생성
  
  Args:
    data: 토큰에 포함할 데이터 (주로 {"sub": "user_email"} 형태)
    expires_delta: 토큰 만료 시간 (None이면 기본값 사용: 24시간)
    
  Returns:
    str: 인코딩된 JWT 토큰
  """
  to_encode = data.copy()
  
  # 만료 시간 설정: 파라미터로 받거나 기본값(24시간) 사용
  if expires_delta:
    expire = datetime.utcnow() + expires_delta
  else:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  
  # JWT payload에 만료 시간 추가
  to_encode.update({"exp": expire})
  
  # JWT 토큰 인코딩 (SECRET_KEY로 서명)
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt


def verify_token(token: str) -> Optional[str]:
  """
  JWT 토큰 검증 및 사용자 이메일 추출
  
  Args:
    token: 검증할 JWT 토큰
    
  Returns:
    Optional[str]: 토큰이 유효하면 사용자 이메일, 무효하면 None
  """
  try:
    # JWT 토큰 디코딩 (SECRET_KEY로 서명 검증)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    # 토큰에서 사용자 이메일 추출 (JWT 표준에서 "sub"는 subject를 의미)
    email: str = payload.get("sub")
    
    if email is None:
      return None
      
    return email
    
  except JWTError:
    # 토큰이 무효하거나 만료된 경우
    return None