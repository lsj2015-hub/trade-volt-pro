from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

class Settings(BaseSettings):
  # App Configuration
  app_name: str = "Trade Volt API"
  app_version: str = "1.0.0"
  environment: str = Field(default="development")
  debug: bool = Field(default=True)
  
  # Database
  mysql_host: str = Field(..., env="MYSQL_HOST")
  mysql_port: int = Field(default=3306, env="MYSQL_PORT")
  mysql_user: str = Field(..., env="MYSQL_USER")
  mysql_password: str = Field(..., env="MYSQL_PASSWORD")
  mysql_database: str = Field(..., env="MYSQL_DATABASE")
  database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
  
  # CORS
  cors_origins: List[str] = Field(
    default=["http://localhost:3000"],
    env="CORS_ORIGINS"
  )

  # 환율정보 api
  koreaexim_api_key: Optional[str] = Field(default=None, env="KOREAEXIM_API_KEY")
  koreaexim_base_url:  str = Field(
    default="https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON", 
    env="KOREAEXIM_BASE_URL"
  )

  # KIS API Configuration
  kis_app_key: str = Field(..., env="KIS_APP_KEY")
  kis_app_secret: str = Field(..., env="KIS_APP_SECRET")
  kis_base_url: str = Field(
    default="https://openapi.koreainvestment.com:9443", 
    env="KIS_BASE_URL"
  )

  # OPENAI API Configuration
  openai_api_key: str = Field(..., env="OPENAI_API_KEY")

  # JWT Configuration
  secret_key: str = Field(..., env="SECRET_KEY")
  algorithm: str = Field(default="HS256", env="ALGORITHM")
  access_token_expire_minutes: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
  
  @property
  def mysql_url(self) -> str:
    if self.database_url:
      return self.database_url
    return f"mysql+aiomysql://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
  
  @property
  def sync_mysql_url(self) -> str:
    return f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
  
  class Config:
    env_file = Path(__file__).parent.parent.parent / ".env"
    case_sensitive = False
    env_file_encoding = 'utf-8'


@lru_cache()
def get_settings() -> Settings:
  # .env 파일 수동 로드
  env_file = Path(__file__).parent.parent.parent / ".env"
  if env_file.exists():
    load_dotenv(env_file, override=True)
    print(f"✅ Loaded .env from: {env_file}")
  else:
    print(f"❌ .env file not found at: {env_file}")
    
  settings = Settings()
  
  return settings