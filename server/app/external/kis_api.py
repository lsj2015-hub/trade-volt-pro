import httpx
import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.exceptions import CustomHTTPException
from app.config.settings import get_settings
from app.config.database import get_async_session

logger = logging.getLogger(__name__)


class KISAPIService:
 """한국투자증권 Open API 서비스 - 단순화된 버전"""
 
 def __init__(self):
   self.access_token: Optional[str] = None
   self.token_expired_time: Optional[datetime] = None
 
 async def ensure_valid_token(self, user_id: int) -> str:
   """사용자의 유효한 토큰 확보 (단순화된 진입점)"""
   logger.info(f"KIS 토큰 확보 요청: user_id={user_id}")
   
   # 1. DB에서 유효한 토큰 확인
   token = await self._get_valid_token_from_db(user_id)
   if token:
     logger.info(f"DB에서 유효한 토큰 사용: user_id={user_id}")
     return token
   
   # 2. 유효한 토큰이 없으면 새로 발급
   logger.info(f"새 토큰 발급 시작: user_id={user_id}")
   new_token = await self._issue_and_save_new_token(user_id)
   return new_token

 async def _get_valid_token_from_db(self, user_id: int) -> Optional[str]:
   """DB에서 유효한 토큰 조회 (내부 메서드)"""
   async for db in get_async_session():
     try:
       from app.models.kis_token import KisToken
       
       # 현재 시간만 체크 (buffer 제거하여 더 정확하게)
       now = datetime.now()
       logger.info(f"토큰 만료 확인: user_id={user_id}, current_time={now}")
       
       query = select(KisToken).where(
         KisToken.user_id == user_id,
         KisToken.expires_at > now  # buffer_time 대신 현재 시간만 사용
       ).order_by(KisToken.created_at.desc())
       
       result = await db.execute(query)
       token_record = result.scalar_one_or_none()
       
       if token_record:
         # 메모리에 동기화
         self.access_token = token_record.access_token
         self.token_expired_time = token_record.expires_at
         logger.info(f"DB에서 토큰 조회 성공: user_id={user_id}, expires_at={token_record.expires_at}")
         return token_record.access_token
       else:
         logger.info(f"DB에 유효한 토큰 없음: user_id={user_id}")
         
       return None
       
     except Exception as e:
       logger.error(f"DB 토큰 조회 오류: user_id={user_id}, error={str(e)}")
       return None

 async def _delete_expired_tokens(self, user_id: int) -> None:
   """만료된 토큰 삭제 (내부 메서드)"""
   async for db in get_async_session():
     try:
       from app.models.kis_token import KisToken
       
       await db.execute(delete(KisToken).where(KisToken.user_id == user_id))
       await db.commit()
       
       # 메모리도 초기화
       self.access_token = None
       self.token_expired_time = None
       
       logger.info(f"만료된 토큰 삭제 완료: user_id={user_id}")
       
     except Exception as e:
       await db.rollback()
       logger.error(f"토큰 삭제 실패: user_id={user_id}, error={str(e)}")

 async def _issue_and_save_new_token(self, user_id: int) -> str:
   """새 토큰 발급 및 저장 (내부 메서드)"""
   try:
     # 1. KIS API에서 새 토큰 발급
     token_data = await self._call_kis_token_api()
     
     # 2. DB에 저장
     await self._save_token_to_db(user_id, token_data)
     
     logger.info(f"새 토큰 발급 완료: user_id={user_id}")
     return token_data["access_token"]
     
   except Exception as e:
     logger.error(f"토큰 발급 실패: user_id={user_id}, error={str(e)}")
     raise

 async def _call_kis_token_api(self) -> Dict:
   """KIS API 토큰 발급 호출 (내부 메서드)"""
   settings = get_settings()
   
   url = f"{settings.kis_base_url}/oauth2/tokenP"
   headers = {"Content-Type": "application/json; charset=utf-8"}
   data = {
     "grant_type": "client_credentials",
     "appkey": settings.kis_app_key,
     "appsecret": settings.kis_app_secret
   }
   
   try:
     async with httpx.AsyncClient() as client:
       response = await client.post(url, json=data, headers=headers)
       
       if response.status_code != 200:
         raise CustomHTTPException(
           status_code=400,
           detail=f"KIS API 토큰 발급 실패: {response.text}",
           error_code="KIS_TOKEN_ERROR"
         )
       
       result = response.json()
       
       # 메모리에 저장
       self.access_token = result.get("access_token")
       expires_in = result.get("expires_in", 86400)  # 기본 24시간
       self.token_expired_time = datetime.now() + timedelta(seconds=expires_in)
       
       return {
         "access_token": result.get("access_token"),
         "expires_in": expires_in,
         "expires_at": self.token_expired_time
       }
       
   except httpx.RequestError as e:
     raise CustomHTTPException(
       status_code=500,
       detail="KIS API 서버 연결 실패",
       error_code="KIS_CONNECTION_ERROR"
     )

 async def _save_token_to_db(self, user_id: int, token_data: Dict) -> None:
   """토큰을 DB에 저장 (내부 메서드)"""
   async for db in get_async_session():
     try:
       from app.models.kis_token import KisToken
       
       # 기존 토큰들 모두 삭제 (사용자당 하나만 유지)
       await db.execute(delete(KisToken).where(KisToken.user_id == user_id))
       
       # 새 토큰 저장
       new_token = KisToken(
         user_id=user_id,
         access_token=token_data["access_token"],
         expires_at=token_data["expires_at"]
       )
       
       db.add(new_token)
       await db.commit()
       
       logger.info(f"토큰 DB 저장 완료: user_id={user_id}")
       
     except Exception as e:
       await db.rollback()
       logger.error(f"토큰 저장 실패: user_id={user_id}, error={str(e)}")
       raise

 async def get_stock_price(
   self, 
   user_id: int,
   symbol: str, 
   market_type: str = "DOMESTIC",
   date: Optional[str] = None
 ) -> Dict:
   """주식 현재가/과거가 조회"""
   # 토큰 확보 (필요시 자동 발급)
   access_token = await self.ensure_valid_token(user_id)
     
   settings = get_settings()
   base_url = settings.kis_base_url
   
   # API 호출 로직 (기존과 동일)
   if market_type.upper() == "DOMESTIC":
     if date:
       url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price"
       tr_id = "FHKST01010400"
       params = {
         "fid_cond_mrkt_div_code": "J",
         "fid_input_iscd": symbol,
         "fid_period_div_code": "D",
         "fid_org_adj_prc": "1",
         "fid_input_date_1": date
       }
     else:
       url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
       tr_id = "FHKST01010100"
       params = {
         "fid_cond_mrkt_div_code": "J",
         "fid_input_iscd": symbol
       }
     
     headers = {
       "Content-Type": "application/json; charset=utf-8",
       "authorization": f"Bearer {access_token}",
       "appkey": settings.kis_app_key,
       "appsecret": settings.kis_app_secret,
       "tr_id": tr_id
     }
     
   else:  # OVERSEAS
     if date:
       url = f"{base_url}/uapi/overseas-price/v1/quotations/dailyprice"
       tr_id = "HHDFS76240000"
       params = {
         "auth": "",
         "excd": "NAS",
         "symb": symbol,
         "gubn": "0",
         "bymd": date,
         "modp": "1"
       }
     else:
       url = f"{base_url}/uapi/overseas-price/v1/quotations/price"
       tr_id = "HHDFS00000300"
       params = {
         "auth": "",
         "excd": "NAS",
         "symb": symbol
       }
     
     headers = {
       "Content-Type": "application/json; charset=utf-8",
       "authorization": f"Bearer {access_token}",
       "appkey": settings.kis_app_key,
       "appsecret": settings.kis_app_secret,
       "tr_id": tr_id
     }
   
   try:
     async with httpx.AsyncClient() as client:
       response = await client.get(url, headers=headers, params=params)
       
       if response.status_code != 200:
         response_text = response.text
         
         # 토큰 만료 에러인 경우 재시도
         if "기간이 만료된 token" in response_text or "EGW00123" in response_text:
           logger.warning(f"토큰 만료 감지, 새 토큰으로 재시도: user_id={user_id}, symbol={symbol}")
           
           # DB에서 기존 토큰 삭제
           await self._delete_expired_tokens(user_id)
           
           # 새 토큰 발급
           access_token = await self.ensure_valid_token(user_id)
           
           # 헤더 업데이트
           headers["authorization"] = f"Bearer {access_token}"
           
           # 재시도
           response = await client.get(url, headers=headers, params=params)
           
           if response.status_code != 200:
             logger.error(f"KIS API 재시도 실패: {response.text}")
             raise CustomHTTPException(
               status_code=400,
               detail=f"KIS API 주가 조회 실패 (재시도 후): {response.text}",
               error_code="KIS_PRICE_ERROR"
             )
           else:
             logger.info(f"토큰 재발급 후 성공: user_id={user_id}, symbol={symbol}")
         else:
           logger.error(f"KIS API 주가 조회 실패: {response_text}")
           raise CustomHTTPException(
             status_code=400,
             detail=f"KIS API 주가 조회 실패: {response_text}",
             error_code="KIS_PRICE_ERROR"
           )
       
       result = response.json()
       
       # 응답 데이터 파싱 (기존 메서드 재사용)
       if market_type.upper() == "DOMESTIC":
         return self._parse_domestic_price(result, symbol, date is not None)
       else:
         return self._parse_overseas_price(result, symbol, date is not None)
       
   except httpx.RequestError:
     raise CustomHTTPException(
       status_code=500,
       detail="KIS API 서버 연결 실패",
       error_code="KIS_CONNECTION_ERROR"
     )
   except Exception as e:
     logger.error(f"주가 조회 중 오류: {str(e)}")
     raise CustomHTTPException(
       status_code=500,
       detail="주가 조회 중 내부 오류 발생",
       error_code="INTERNAL_ERROR"
     )
 
 # 기존 파싱 메서드들은 그대로 유지
 def _parse_domestic_price(self, response_data: Dict, symbol: str, is_historical: bool = False) -> Dict:
   """국내주식 응답 데이터 파싱"""
   if is_historical:
     output = response_data.get("output", [])
     if output:
       data = output[0]
       return {
         "symbol": symbol,
         "market_type": "DOMESTIC",
         "current_price": float(data.get("stck_clpr", 0)),
         "previous_close": float(data.get("stck_prpr", 0)),
         "daily_return_rate": float(data.get("prdy_ctrt", 0)),
         "day_change": float(data.get("prdy_vrss", 0)),
         "volume": int(data.get("acml_vol", 0)),
         "high_price": float(data.get("stck_hgpr", 0)),
         "low_price": float(data.get("stck_lwpr", 0)),
         "open_price": float(data.get("stck_oprc", 0)),
         "currency": "KRW",
         "updated_at": datetime.now().isoformat(),
         "query_date": data.get("stck_bsop_date")
       }
     else:
       raise CustomHTTPException(
         status_code=404,
         detail="해당 날짜의 시세 데이터를 찾을 수 없습니다.",
         error_code="NO_PRICE_DATA"
       )
   else:
     output = response_data.get("output", {})
     return {
       "symbol": symbol,
       "market_type": "DOMESTIC",
       "current_price": float(output.get("stck_prpr", 0)),
       "previous_close": float(output.get("stck_sdpr", 0)),
       "daily_return_rate": float(output.get("prdy_ctrt", 0)),
       "day_change": float(output.get("prdy_vrss", 0)),
       "volume": int(output.get("acml_vol", 0)),
       "high_price": float(output.get("stck_hgpr", 0)),
       "low_price": float(output.get("stck_lwpr", 0)),
       "open_price": float(output.get("stck_oprc", 0)),
       "currency": "KRW",
       "updated_at": datetime.now().isoformat()
     }
 
 def _parse_overseas_price(self, response_data: Dict, symbol: str, is_historical: bool = False) -> Dict:
   """해외주식 응답 데이터 파싱"""
   
   # 안전한 변환 헬퍼 함수들
   def safe_float(value, default=0.0):
     if value is None or value == '' or value == '-':
       return default
     try:
       return float(value)
     except (ValueError, TypeError):
       return default

   def safe_int(value, default=0):
     if value is None or value == '' or value == '-':
       return default
     try:
       return int(value)
     except (ValueError, TypeError):
       return default
   
   if is_historical:
     output = response_data.get("output", [])
     if output:
       data = output[0]
       return {
         "symbol": symbol,
         "market_type": "OVERSEAS", 
         "current_price": safe_float(data.get("clos"), 0),
         "previous_close": safe_float(data.get("base"), 0),
         "daily_return_rate": safe_float(data.get("rate"), 0),
         "day_change": safe_float(data.get("diff"), 0),
         "volume": safe_int(data.get("tvol"), 0),
         "high_price": safe_float(data.get("high"), 0),
         "low_price": safe_float(data.get("low"), 0),
         "open_price": safe_float(data.get("open"), 0),
         "currency": "USD",
         "updated_at": datetime.now().isoformat(),
         "query_date": data.get("xymd")
       }
     else:
       raise CustomHTTPException(
         status_code=404,
         detail="해당 날짜의 시세 데이터를 찾을 수 없습니다.",
         error_code="NO_PRICE_DATA"
       )
   else:
     output = response_data.get("output", {})
     return {
       "symbol": symbol,
       "market_type": "OVERSEAS",
       "current_price": safe_float(output.get("last"), 0),
       "previous_close": safe_float(output.get("base"), 0),
       "daily_return_rate": safe_float(output.get("rate"), 0),
       "day_change": safe_float(output.get("diff"), 0),
       "volume": safe_int(output.get("tvol"), 0),
       "high_price": safe_float(output.get("high"), 0),
       "low_price": safe_float(output.get("low"), 0),
       "open_price": safe_float(output.get("open"), 0),
       "currency": "USD",
       "updated_at": datetime.now().isoformat()
     }
 
 async def get_multiple_stock_prices(self, user_id: int, stocks: list) -> Dict[str, Dict]:
   """여러 주식의 현재가 일괄 조회"""
   results = {}
   
   for stock_info in stocks:
     symbol = stock_info.get("symbol")
     market_type = stock_info.get("market_type", "DOMESTIC")
     date = stock_info.get("date")
     
     try:
       price_data = await self.get_stock_price(user_id, symbol, market_type, date)
       results[symbol] = price_data
     except Exception as e:
       logger.error(f"주식 {symbol} 가격 조회 실패: {str(e)}")
       results[symbol] = {
         "symbol": symbol,
         "market_type": market_type,
         "current_price": 0,
         "previous_close": 0,
         "error": str(e)
       }
   
   return results


# 싱글톤 인스턴스
kis_api_service = KISAPIService()