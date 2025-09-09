import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def _classify_unit(value: float) -> tuple[str, float]:
  """금액 단위를 조, 억 등으로 분류"""
  if abs(value) >= 1_000_000_000_000:
    return "조", value / 1_000_000_000_000
  if abs(value) >= 100_000_000:
    return "억", value / 100_000_000
  elif abs(value) >= 1_000_000:
    return "백만", value / 1_000_000
  else:
    # 억 미만은 그대로 표시하되, 천 단위 쉼표를 위해 포맷팅에서 처리
    return "", value

def _format_usd_bilingual(amount: float, rate: float) -> str:
  """USD 금액을 원화와 병기하여 포맷팅 (미국 주식용)"""
  if amount is None or pd.isna(amount) or amount == 0:
    return "-"
  
  usd_unit, usd_value = _classify_unit(amount)
  usd_fmt = f"${usd_value:,.2f}{usd_unit}"
  
  krw_total = amount * rate
  krw_unit, krw_value = _classify_unit(krw_total)
  krw_fmt = f"₩{krw_value:,.2f}{krw_unit}"
  
  return f"{usd_fmt} ({krw_fmt})"

def _format_krw(amount: float) -> str:
  """KRW 금액을 포맷팅 (한국 주식용)"""
  if amount is None or pd.isna(amount) or amount == 0:
    return "-"
  
  krw_unit, krw_value = _classify_unit(amount)
  # 소수점 둘째 자리까지 표시하되, .00이면 정수로 보이게 처리
  value_str = f"{krw_value:,.2f}".rstrip('0').rstrip('.')
  return f"₩{value_str}{krw_unit}"

async def format_currency_by_exchange(amount: float, exchange_code: str) -> str:
  """거래소 코드 기반 다국가 통화 포맷팅 (실시간 환율 연동)"""
  if amount is None or pd.isna(amount) or amount == 0:
    return "-"
  
  from app.core.constants import EXCHANGE_CURRENCY_MAP, CURRENCY_SYMBOLS
  from app.external.exchange_rate_api import exchange_rate_service
  
  # 지원 거래소 체크
  if exchange_code not in EXCHANGE_CURRENCY_MAP:
    logger.error(f"지원하지 않는 거래소 코드: {exchange_code}")
    return "지원하지 않는 거래소"
  
  base_currency = EXCHANGE_CURRENCY_MAP[exchange_code]
  currency_symbol = CURRENCY_SYMBOLS[base_currency]
  
  # 한국 주식은 원화만 표시
  if base_currency == "KRW":
    return _format_krw(amount)
  
  # 해외 주식은 현지통화 + 원화 병기
  else:
    local_unit, local_value = _classify_unit(amount)
    local_fmt = f"{currency_symbol}{local_value:,.2f}{local_unit}"
    
    try:
      conversion = await exchange_rate_service.convert_to_krw(amount, base_currency)
      
      if conversion["success"]:
        krw_amount = conversion["converted_amount"]
        krw_unit, krw_value = _classify_unit(krw_amount)
        krw_fmt = f"₩{krw_value:,.2f}{krw_unit}"
        return f"{local_fmt} ({krw_fmt})"
      else:
        return f"{local_fmt} (환율 정보 없음)"
        
    except Exception as e:
      logger.warning(f"환율 변환 실패 ({base_currency} -> KRW): {e}")
      return f"{local_fmt} (환율 변환 실패)"

# 기존 format_currency는 호환성을 위해 유지하되 deprecated 표시
def format_currency(amount: float, symbol: str, rate: float, country_code: str = None) -> str:
  """[DEPRECATED] 기존 호환성용 - format_currency_by_exchange 사용 권장"""
  if amount is None or pd.isna(amount):
    return "-"
      
  # country_code 우선, 없으면 symbol suffix로 판별
  is_korean_stock = (country_code == 'KR') or symbol.upper().endswith(('.KS', '.KQ'))
  
  if is_korean_stock:
    return _format_krw(amount)
  else:
    return _format_usd_bilingual(amount, rate)

def format_stock_profile(info: dict, summary_kr: str) -> dict:
  """회사 기본 정보를 API 응답 포맷으로 변환"""
  business_summary = summary_kr or info.get('longBusinessSummary', '정보 없음')

  return {
    "symbol": info.get('symbol', '').upper(),
    "long_name": info.get('longName', '정보 없음'),
    "industry": info.get('industry', '정보 없음'),
    "sector": info.get('sector', '정보 없음'),
    "long_business_summary": business_summary,
    "city": info.get('city', ''),
    "state": info.get('state', ''),
    "country": info.get('country', ''),
    "website": info.get('website'),
    "full_time_employees": f"{info.get('fullTimeEmployees', 0):,}" if info.get('fullTimeEmployees') else "정보 없음",
  }

async def format_financial_summary(info: dict, exchange_code: str) -> dict:
  """재무 요약 정보를 거래소별 통화로 포맷팅"""
  
  ex_dividend_timestamp = info.get('exDividendDate')
  ex_dividend_date_str = None
  if ex_dividend_timestamp:
    ex_dividend_date_str = datetime.fromtimestamp(ex_dividend_timestamp).strftime('%Y-%m-%d')

  return {
    "total_revenue": await format_currency_by_exchange(info.get('totalRevenue'), exchange_code),
    "net_income_to_common": await format_currency_by_exchange(info.get('netIncomeToCommon'), exchange_code),
    "operating_margins": f"{info.get('operatingMargins', 0) * 100:.2f}%" if info.get('operatingMargins') is not None else "-",
    "dividend_yield": f"{info.get('dividendYield', 0):.2f}%" if info.get('dividendYield') is not None else "-",
    "trailing_eps": await format_currency_by_exchange(info.get('trailingEps'), exchange_code),
    "total_cash": await format_currency_by_exchange(info.get('totalCash'), exchange_code),
    "total_debt": await format_currency_by_exchange(info.get('totalDebt'), exchange_code),
    "debt_to_equity": f"{info.get('debtToEquity'):.2f}" if info.get('debtToEquity') is not None else "-",
    "ex_dividend_date": ex_dividend_date_str
  }
    
def format_investment_metrics(info: dict) -> dict:
  """투자 지표를 API 응답 포맷으로 변환"""
  return {
    "trailing_pe": f"{info.get('trailingPE'):.2f}" if info.get('trailingPE') is not None else "-",
    "forward_pe": f"{info.get('forwardPE'):.2f}" if info.get('forwardPE') is not None else "-",
    "price_to_book": f"{info.get('priceToBook'):.2f}" if info.get('priceToBook') is not None else "-",
    "return_on_equity": f"{info.get('returnOnEquity', 0) * 100:.2f}%" if info.get('returnOnEquity') is not None else "-",
    "return_on_assets": f"{info.get('returnOnAssets', 0) * 100:.2f}%" if info.get('returnOnAssets') is not None else "-",
    "beta": f"{info.get('beta'):.2f}" if info.get('beta') is not None else "-",
  }

async def format_market_data(info: dict, exchange_code: str) -> dict:
  """시장 정보를 거래소별 통화로 포맷팅"""
  return {
    "current_price": await format_currency_by_exchange(info.get('currentPrice'), exchange_code),
    "previous_close": await format_currency_by_exchange(info.get('previousClose'), exchange_code),
    "day_high": await format_currency_by_exchange(info.get('dayHigh'), exchange_code),
    "day_low": await format_currency_by_exchange(info.get('dayLow'), exchange_code),
    "fifty_two_week_high": await format_currency_by_exchange(info.get('fiftyTwoWeekHigh'), exchange_code),
    "fifty_two_week_low": await format_currency_by_exchange(info.get('fiftyTwoWeekLow'), exchange_code),
    "market_cap": await format_currency_by_exchange(info.get('marketCap'), exchange_code),
    "shares_outstanding": f"{info.get('sharesOutstanding', 0):,}주" if info.get('sharesOutstanding') else "-",
    "volume": f"{info.get('volume', 0):,}주" if info.get('volume') else "-",
  }
    
async def format_analyst_recommendations(info: dict, exchange_code: str) -> dict:
  """분석가 의견을 거래소별 통화로 포맷팅"""
  return {
    "recommendation_mean": info.get('recommendationMean', 0),
    "recommendation_key": info.get('recommendationKey', '').upper(),
    "number_of_analyst_opinions": info.get('numberOfAnalystOpinions', 0),
    "target_mean_price": await format_currency_by_exchange(info.get('targetMeanPrice'), exchange_code),
    "target_high_price": await format_currency_by_exchange(info.get('targetHighPrice'), exchange_code),
    "target_low_price": await format_currency_by_exchange(info.get('targetLowPrice'), exchange_code),
  }

async def format_financial_statement_response(df_raw: pd.DataFrame, statement_type: str, symbol: str, exchange_code: str = None) -> dict:
  """재무제표를 API 응답 포맷으로 변환 (다국가 거래소 지원 + 3개년도 제한)"""
  from app.core.constants import INCOME_KR, BALANCE_KR, CASHFLOW_KR, EXCHANGE_CURRENCY_MAP
  from app.external.exchange_rate_api import exchange_rate_service
  
  # 최근 3개년도만 선택
  recent_columns = df_raw.columns[-3:] if len(df_raw.columns) >= 3 else df_raw.columns
  df_limited = df_raw[recent_columns]
  
  trans_map = {"income": INCOME_KR, "balance": BALANCE_KR, "cashflow": CASHFLOW_KR}.get(statement_type, {})
  
  # 거래소 코드 기반 통화 결정
  if exchange_code and exchange_code in EXCHANGE_CURRENCY_MAP:
    base_currency = EXCHANGE_CURRENCY_MAP[exchange_code]
    is_korean_stock = (base_currency == "KRW")
  else:
    # fallback: 기존 로직
    is_korean_stock = symbol.upper().endswith(('.KS', '.KQ'))
    base_currency = "KRW" if is_korean_stock else "USD"

  years = [str(y.year) for y in df_limited.columns]
  formatted_rows = []
  
  # 해외 주식의 경우 환율 정보 조회
  exchange_rate = None
  if not is_korean_stock:
    try:
      rates = await exchange_rate_service.get_multi_currency_rates([base_currency])
      exchange_rate = rates.get(base_currency)
    except Exception as e:
      logger.warning(f"환율 정보 조회 실패 ({base_currency}): {e}")
      exchange_rate = None
  
  for k, v in trans_map.items():
    if k in df_limited.index:
      row_data = {"item": v}
      for col in df_limited.columns:
        val = df_limited.loc[k, col]
        if pd.notnull(val):
          formatted_value = await _format_financial_value(val, is_korean_stock, base_currency, exchange_rate)
          row_data[str(col.year)] = formatted_value
        else:
          row_data[str(col.year)] = '-'
      formatted_rows.append(row_data)
          
  return {"years": years, "data": formatted_rows}

async def _format_financial_value(value: float, is_korean_stock: bool, base_currency: str, exchange_rate: float = None) -> str:
  """재무제표 값을 통화별로 포맷팅"""
  from app.core.constants import CURRENCY_SYMBOLS
  
  if is_korean_stock:
    # 한국 주식: 원화만 표시
    unit, converted_value = _classify_unit(abs(value))
    value_str = f"{converted_value:,.2f}"
    return f"₩{'-' if value < 0 else ''}{value_str}{unit}"
  else:
    # 해외 주식: 현지통화 + 원화 병기
    currency_symbol = CURRENCY_SYMBOLS.get(base_currency, "$")
    unit, converted_value = _classify_unit(abs(value))
    value_str = f"{converted_value:,.2f}"
    local_fmt = f"{currency_symbol}{'-' if value < 0 else ''}{value_str}{unit}"
    
    # 환율이 있으면 원화도 표시
    if exchange_rate:
      try:
        # JPY는 100엔 단위 보정
        actual_rate = exchange_rate / 100 if base_currency == "JPY" else exchange_rate
        krw_amount = value * actual_rate
        krw_unit, krw_value = _classify_unit(abs(krw_amount))
        krw_fmt = f"₩{'-' if krw_amount < 0 else ''}{krw_value:,.2f}{krw_unit}"
        return f"{local_fmt} ({krw_fmt})"
      except Exception as e:
        logger.warning(f"원화 변환 실패: {e}")
        return f"{local_fmt} (환율 정보 없음)"
    else:
      return f"{local_fmt} (환율 정보 없음)"

def process_price_dataframe(df: pd.DataFrame) -> pd.DataFrame:
  """주가 데이터프레임을 API 응답에 맞게 처리"""
  if df.empty:
    return pd.DataFrame()
  
  df = df.reset_index()
  df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
  df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
  
  final_cols = ["Date", "Close", "High", "Low", "Open", "Volume"]
  return df[[c for c in final_cols if c in df.columns]]