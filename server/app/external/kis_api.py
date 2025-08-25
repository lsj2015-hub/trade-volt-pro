import httpx
import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
from app.core.exceptions import CustomHTTPException
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class KISAPIService:
  """한국투자증권 Open API 서비스"""
  
  def __init__(self):
    self.access_token: Optional[str] = None
    self.token_expired_time: Optional[datetime] = None
  
  async def get_access_token(self, app_key: Optional[str] = None, app_secret: Optional[str] = None) -> Dict:
    """KIS Open API 접근 토큰 발급"""
    settings = get_settings()
    
    # 파라미터가 없으면 설정에서 가져오기
    app_key = app_key or settings.kis_app_key
    app_secret = app_secret or settings.kis_app_secret
    base_url = settings.kis_base_url
    
    url = f"{base_url}/oauth2/tokenP"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    data = {
      "grant_type": "client_credentials",
      "appkey": app_key,
      "appsecret": app_secret
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
        
        # 토큰 정보 저장
        self.access_token = result.get("access_token")
        expires_in = result.get("expires_in", 86400)
        self.token_expired_time = datetime.now() + timedelta(seconds=expires_in)
        
        return {
          "access_token": result.get("access_token"),
          "token_type": result.get("token_type"),
          "expires_in": result.get("expires_in"),
          "access_token_token_expired": result.get("access_token_token_expired"),
          "issued_at": datetime.now().isoformat(),
          "expires_at": self.token_expired_time.isoformat() if self.token_expired_time else None
        }
        
    except httpx.RequestError:
      raise CustomHTTPException(
        status_code=500,
        detail="KIS API 서버 연결 실패",
        error_code="KIS_CONNECTION_ERROR"
      )
    except Exception:
      raise CustomHTTPException(
        status_code=500,
        detail="토큰 발급 중 내부 오류 발생",
        error_code="INTERNAL_ERROR"
      )
  
  async def revoke_token(self, token: str, app_key: Optional[str] = None, app_secret: Optional[str] = None) -> Dict:
    """KIS Open API 접근 토큰 폐기"""
    settings = get_settings()
    
    app_key = app_key or settings.kis_app_key
    app_secret = app_secret or settings.kis_app_secret
    base_url = settings.kis_base_url
    
    url = f"{base_url}/oauth2/revokeP"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    data = {
      "appkey": app_key,
      "appsecret": app_secret,
      "token": token
    }
    
    try:
      async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        
        if response.status_code != 200:
          raise CustomHTTPException(
            status_code=400,
            detail=f"KIS API 토큰 폐기 실패: {response.text}",
            error_code="KIS_REVOKE_ERROR"
          )
        
        result = response.json()
        
        # 토큰 정보 초기화
        self.access_token = None
        self.token_expired_time = None
        
        return {
          "code": result.get("code"),
          "message": result.get("message"),
          "revoked_at": datetime.now().isoformat()
        }
        
    except httpx.RequestError:
      raise CustomHTTPException(
        status_code=500,
        detail="KIS API 서버 연결 실패",
        error_code="KIS_CONNECTION_ERROR"
      )
    except Exception:
      raise CustomHTTPException(
        status_code=500,
        detail="토큰 폐기 중 내부 오류 발생",
        error_code="INTERNAL_ERROR"
      )
  
  def is_token_valid(self) -> bool:
    """토큰 유효성 검사"""
    if not self.access_token or not self.token_expired_time:
      return False
    
    # 만료 5분 전을 기준으로 토큰 유효성 판단
    return datetime.now() < (self.token_expired_time - timedelta(minutes=5))
  
  def get_current_token(self) -> Optional[str]:
    """현재 유효한 토큰 반환"""
    if self.is_token_valid():
      return self.access_token
    return None

  async def get_stock_price(
    self, 
    symbol: str, 
    market_type: str = "DOMESTIC",
    date: Optional[str] = None  # YYYYMMDD 형식, None이면 현재가 조회
  ) -> Dict:
    """주식 현재가/과거가 조회"""
    if not self.is_token_valid():
      await self.get_access_token()
    
    settings = get_settings()
    base_url = settings.kis_base_url
    
    # 국내주식 vs 해외주식 API 엔드포인트 분리
    if market_type.upper() == "DOMESTIC":
      if date:
        # 과거 일자별 시세 조회
        url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price"
        tr_id = "FHKST01010400"
        params = {
          "fid_cond_mrkt_div_code": "J",
          "fid_input_iscd": symbol,
          "fid_period_div_code": "D",  # 일봉
          "fid_org_adj_prc": "1",     # 수정주가 반영
          "fid_input_date_1": date    # 조회 시작일
        }
      else:
        # 현재가 조회
        url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        tr_id = "FHKST01010100"
        params = {
          "fid_cond_mrkt_div_code": "J",
          "fid_input_iscd": symbol
        }
      
      headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {self.access_token}",
        "appkey": settings.kis_app_key,
        "appsecret": settings.kis_app_secret,
        "tr_id": tr_id
      }
      
    else:  # OVERSEAS
      if date:
        # 해외주식 과거 시세 조회 (일봉)
        url = f"{base_url}/uapi/overseas-price/v1/quotations/dailyprice"
        tr_id = "HHDFS76240000"
        params = {
          "auth": "",
          "excd": "NAS",  # 나스닥
          "symb": symbol,
          "gubn": "0",    # 일봉
          "bymd": date,   # 조회 기준일
          "modp": "1"     # 수정주가
        }
      else:
        # 현재가 조회 (기존과 동일)
        url = f"{base_url}/uapi/overseas-price/v1/quotations/price"
        tr_id = "HHDFS00000300"
        params = {
          "auth": "",
          "excd": "NAS",
          "symb": symbol
        }
      
      headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {self.access_token}",
        "appkey": settings.kis_app_key,
        "appsecret": settings.kis_app_secret,
        "tr_id": tr_id
      }
    
    try:
      async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
          logger.error(f"KIS API 주가 조회 실패: {response.text}")
          raise CustomHTTPException(
            status_code=400,
            detail=f"KIS API 주가 조회 실패: {response.text}",
            error_code="KIS_PRICE_ERROR"
          )
        
        result = response.json()
        
        # 응답 데이터 파싱
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
    if is_historical:
      output = response_data.get("output", [])
      if output:
        data = output[0]
        return {
          "symbol": symbol,
          "market_type": "OVERSEAS", 
          "current_price": float(data.get("clos", 0)),
          "previous_close": float(data.get("base", 0)),
          "daily_return_rate": float(data.get("rate", 0)),  # day_change_rate -> daily_return_rate로 변경
          "day_change": float(data.get("diff", 0)),
          "volume": int(data.get("tvol", 0)),
          "high_price": float(data.get("high", 0)),
          "low_price": float(data.get("low", 0)),
          "open_price": float(data.get("open", 0)),
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
        "current_price": float(output.get("last", 0)),
        "previous_close": float(output.get("base", 0)),
        "daily_return_rate": float(output.get("rate", 0)),  # day_change_rate -> daily_return_rate로 변경
        "day_change": float(output.get("diff", 0)),
        "volume": int(output.get("tvol", 0)),
        "high_price": float(output.get("high", 0)),
        "low_price": float(output.get("low", 0)),
        "open_price": float(output.get("open", 0)),
        "currency": "USD",
        "currency": "USD",
        "updated_at": datetime.now().isoformat()
      }
  
  async def get_multiple_stock_prices(self, stocks: list) -> Dict[str, Dict]:
    """여러 주식의 현재가 일괄 조회"""
    results = {}
    
    for stock_info in stocks:
      symbol = stock_info.get("symbol")
      market_type = stock_info.get("market_type", "DOMESTIC")
      date = stock_info.get("date")  # 날짜 인수 추가
      
      try:
        price_data = await self.get_stock_price(symbol, market_type, date)
        results[symbol] = price_data
      except Exception as e:
        logger.error(f"주식 {symbol} 가격 조회 실패: {str(e)}")
        # 실패한 경우 기본값 설정
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