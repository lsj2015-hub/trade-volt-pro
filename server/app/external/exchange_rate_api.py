import httpx
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
from app.core.exceptions import CustomHTTPException
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class ExchangeRateService:
  """환율 정보 서비스 (한국수출입은행 API 활용)"""
  settings = get_settings()
  
  def __init__(self):
    self.base_url = "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON"
    self.cache = {}  # 간단한 캐시 (메모리)
    self.cache_ttl = 3600  # 1시간 캐시
  
  def _get_cache_key(self, search_date: str) -> str:
    """캐시 키 생성"""
    return f"exchange_rate_{search_date}"
  
  def _is_cache_valid(self, cache_time: datetime) -> bool:
    """캐시 유효성 검사"""
    return datetime.now() - cache_time < timedelta(seconds=self.cache_ttl)
  
  async def get_exchange_rates(self, search_date: Optional[str] = None) -> Dict:
    """일자별 환율 정보 조회"""
    # 기본값: 오늘 날짜
    if not search_date:
      search_date = datetime.now().strftime("%Y%m%d")
    
    # 캐시 확인
    cache_key = self._get_cache_key(search_date)
    if cache_key in self.cache:
      cached_data, cached_time = self.cache[cache_key]
      if self._is_cache_valid(cached_time):
        logger.info(f"환율 정보 캐시 히트: {search_date}")
        return cached_data
    
    # API 호출
    settings = get_settings()
    auth_key = getattr(settings, 'koreaexim_api_key', None)
    
    if not auth_key:
      raise CustomHTTPException(
        status_code=400,
        detail="한국수출입은행 API 키가 설정되지 않았습니다",
        error_code="EXCHANGE_API_KEY_MISSING"
      )
    
    params = {
      "authkey": auth_key,
      "searchdate": search_date,
      "data": "AP01"  # 환율 정보
    }
    
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(self.base_url, params=params)
        
        if response.status_code != 200:
          raise CustomHTTPException(
            status_code=400,
            detail=f"환율 정보 조회 실패: {response.text}",
            error_code="EXCHANGE_RATE_ERROR"
          )
        
        raw_data = response.json()
        
        # 데이터가 빈 리스트인 경우 (주말/공휴일)
        if not raw_data:
          # 최근 영업일 데이터 조회 시도
          recent_date = await self._get_recent_business_date(search_date)
          if recent_date != search_date:
            logger.info(f"주말/공휴일 감지. 최근 영업일 조회: {recent_date}")
            return await self.get_exchange_rates(recent_date)
          else:
            raise CustomHTTPException(
              status_code=404,
              detail=f"해당 날짜의 환율 정보를 찾을 수 없습니다: {search_date}",
              error_code="EXCHANGE_RATE_NOT_FOUND"
            )
        
        # 환율 정보 파싱
        processed_data = self._process_exchange_data(raw_data, search_date)
        
        # 캐시 저장
        self.cache[cache_key] = (processed_data, datetime.now())
        
        logger.info(f"환율 정보 조회 완료: {search_date}, 통화 수: {len(processed_data['exchange_rates'])}")
        return processed_data
        
    except httpx.RequestError as e:
      logger.error(f"환율 API 연결 실패: {str(e)}")
      raise CustomHTTPException(
        status_code=500,
        detail="환율 정보 서버 연결 실패",
        error_code="EXCHANGE_CONNECTION_ERROR"
      )
    except Exception as e:
      logger.error(f"환율 정보 조회 중 오류: {str(e)}")
      raise CustomHTTPException(
        status_code=500,
        detail="환율 정보 조회 중 내부 오류 발생",
        error_code="INTERNAL_ERROR"
      )
  
  def _process_exchange_data(self, raw_data: List[Dict], search_date: str) -> Dict:
    """환율 데이터 파싱 및 정리"""
    rates = {}
    
    for rate_info in raw_data:
      currency_code = (rate_info.get("cur_unit") or "").strip()
      currency_name = (rate_info.get("cur_nm") or "").strip()
      deal_bas_r = (rate_info.get("deal_bas_r") or "").strip()
      
      # 빈 값 스킵
      if not currency_code or not deal_bas_r:
        continue
      
      # 쉼표 제거하고 숫자로 변환
      try:
        clean_rate = deal_bas_r.replace(",", "")
        rate_value = Decimal(clean_rate)
        
        rates[currency_code] = {
          "currency_code": currency_code,
          "currency_name": currency_name,
          "exchange_rate": float(rate_value),  # API 응답용
          "exchange_rate_decimal": rate_value,  # 정확한 계산용
          "deal_bas_r": deal_bas_r,  # 원본 문자열
          "ttb": rate_info.get("ttb", ""),  # 현찰 사실때
          "tts": rate_info.get("tts", ""),  # 현찰 파실때
        }
      except (ValueError, TypeError) as e:
        logger.warning(f"환율 파싱 실패 - {currency_code}: {deal_bas_r}, 오류: {str(e)}")
        continue
    
    return {
      "search_date": search_date,
      "data_count": len(rates),
      "exchange_rates": rates,
      "retrieved_at": datetime.now().isoformat()
    }
  
  async def _get_recent_business_date(self, target_date: str) -> str:
    """최근 영업일 찾기 (최대 7일 전까지)"""
    current_date = datetime.strptime(target_date, "%Y%m%d")
    
    for i in range(1, 8):  # 최대 7일 전까지
      previous_date = current_date - timedelta(days=i)
      date_str = previous_date.strftime("%Y%m%d")
      
      # 주말 제외 (월-금만)
      if previous_date.weekday() < 5:  # 0=월요일, 4=금요일
        return date_str
    
    # 7일 내에 영업일을 찾지 못한 경우 원래 날짜 반환
    return target_date
  
  async def get_currency_rate(self, currency_code: str, search_date: Optional[str] = None) -> Dict:
    """특정 통화의 환율 정보만 조회"""
    exchange_data = await self.get_exchange_rates(search_date)
    
    currency_rate = exchange_data["exchange_rates"].get(currency_code.upper())
    if not currency_rate:
      available_currencies = list(exchange_data["exchange_rates"].keys())
      raise CustomHTTPException(
        status_code=404,
        detail=f"{currency_code} 환율 정보를 찾을 수 없습니다. 사용 가능한 통화: {', '.join(available_currencies)}",
        error_code="CURRENCY_RATE_NOT_FOUND"
      )
    
    return {
      "search_date": exchange_data["search_date"],
      "currency": currency_rate,
      "retrieved_at": exchange_data["retrieved_at"]
    }
  
  async def get_usd_krw_rate(self, search_date: Optional[str] = None) -> Dict:
    """USD/KRW 환율 정보 조회 (가장 많이 사용)"""
    return await self.get_currency_rate("USD", search_date)
  
  async def convert_currency(self, amount: float, from_currency: str, to_currency: str = "KRW", search_date: Optional[str] = None) -> Dict:
    """통화 변환 계산"""
    if from_currency.upper() == to_currency.upper():
      return {
        "original_amount": amount,
        "converted_amount": amount,
        "from_currency": from_currency.upper(),
        "to_currency": to_currency.upper(),
        "exchange_rate": 1.0,
        "search_date": search_date or datetime.now().strftime("%Y%m%d")
      }
    
    # 현재는 KRW 기준 환율만 지원 (한국수출입은행 API 특성)
    if to_currency.upper() != "KRW":
      raise CustomHTTPException(
        status_code=400,
        detail="현재는 원화(KRW)로의 변환만 지원합니다",
        error_code="UNSUPPORTED_CONVERSION"
      )
    
    currency_data = await self.get_currency_rate(from_currency, search_date)
    exchange_rate = currency_data["currency"]["exchange_rate_decimal"]
    
    converted_amount = Decimal(str(amount)) * exchange_rate
    
    return {
      "original_amount": amount,
      "converted_amount": float(converted_amount),
      "converted_amount_decimal": converted_amount,
      "from_currency": from_currency.upper(),
      "to_currency": to_currency.upper(),
      "exchange_rate": float(exchange_rate),
      "exchange_rate_decimal": exchange_rate,
      "search_date": currency_data["search_date"],
      "retrieved_at": currency_data["retrieved_at"]
    }
  
  def clear_cache(self):
    """캐시 초기화"""
    self.cache.clear()
    logger.info("환율 정보 캐시 초기화 완료")
  
  def get_cache_info(self) -> Dict:
    """캐시 정보 조회"""
    cache_info = {}
    for key, (data, cached_time) in self.cache.items():
      cache_info[key] = {
        "cached_at": cached_time.isoformat(),
        "is_valid": self._is_cache_valid(cached_time),
        "data_count": data.get("data_count", 0)
      }
    
    return {
      "total_cached_dates": len(self.cache),
      "cache_ttl_seconds": self.cache_ttl,
      "cache_details": cache_info
    }


# 싱글톤 인스턴스
exchange_rate_service = ExchangeRateService()