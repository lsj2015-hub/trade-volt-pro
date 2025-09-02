import pandas as pd
from datetime import datetime
from app.core.constants import INCOME_KR, BALANCE_KR, CASHFLOW_KR

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

def format_currency(amount: float, symbol: str, rate: float, country_code: str = None) -> str:
  """주식 종류(국내/해외)에 따라 통화 포맷팅을 분기"""
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
    "symbol": info.get('symbol', 'N/A').upper(),
    "longName": info.get('longName', '정보 없음'),
    "industry": info.get('industry', '정보 없음'),
    "sector": info.get('sector', '정보 없음'),
    "longBusinessSummary": business_summary,
    "city": info.get('city', ''),
    "state": info.get('state', ''),
    "country": info.get('country', ''),
    "website": info.get('website'),
    "fullTimeEmployees": f"{info.get('fullTimeEmployees', 0):,}" if info.get('fullTimeEmployees') else "정보 없음",
  }

def format_financial_summary(info: dict, symbol: str, rate: float, country_code: str = None) -> dict:
  """재무 요약 정보를 API 응답 포맷으로 변환"""

  # ✅ exDividendDate 포매팅 로직
  ex_dividend_timestamp = info.get('exDividendDate')
  ex_dividend_date_str = None
  if ex_dividend_timestamp:
    # 타임스탬프를 날짜 문자열로 변환
    ex_dividend_date_str = datetime.fromtimestamp(ex_dividend_timestamp).strftime('%Y-%m-%d')

  return {
    "totalRevenue": format_currency(info.get('totalRevenue'), symbol, rate, country_code),
    "netIncomeToCommon": format_currency(info.get('netIncomeToCommon'), symbol, rate, country_code),
    "operatingMargins": f"{info.get('operatingMargins', 0) * 100:.2f}%" if info.get('operatingMargins') is not None else "-",
    "dividendYield": f"{info.get('dividendYield', 0):.2f}%" if info.get('dividendYield') is not None else "-",  # 수정: * 100 추가
    "trailingEps": format_currency(info.get('trailingEps'), symbol, rate, country_code),  # 수정: 통화 포맷팅 적용
    "totalCash": format_currency(info.get('totalCash'), symbol, rate, country_code),
    "totalDebt": format_currency(info.get('totalDebt'), symbol, rate, country_code),
    "debtToEquity": f"{info.get('debtToEquity'):.2f}" if info.get('debtToEquity') is not None else "-",
    "exDividendDate": ex_dividend_date_str
  }
    
def format_investment_metrics(info: dict) -> dict:
  """투자 지표를 API 응답 포맷으로 변환"""
  return {
    "trailingPE": f"{info.get('trailingPE'):.2f}" if info.get('trailingPE') is not None else "-",
    "forwardPE": f"{info.get('forwardPE'):.2f}" if info.get('forwardPE') is not None else "-",
    "priceToBook": f"{info.get('priceToBook'):.2f}" if info.get('priceToBook') is not None else "-",
    "returnOnEquity": f"{info.get('returnOnEquity', 0) * 100:.2f}%" if info.get('returnOnEquity') is not None else "-",
    "returnOnAssets": f"{info.get('returnOnAssets', 0) * 100:.2f}%" if info.get('returnOnAssets') is not None else "-",
    "beta": f"{info.get('beta'):.2f}" if info.get('beta') is not None else "-",
  }

def format_market_data(info: dict, symbol: str, rate: float, country_code: str = None) -> dict:
  """주가/시장 정보를 API 응답 포맷으로 변환"""
  return {
    "currentPrice": format_currency(info.get('currentPrice'), symbol, rate, country_code),
    "previousClose": format_currency(info.get('previousClose'), symbol, rate, country_code),
    "dayHigh": format_currency(info.get('dayHigh'), symbol, rate, country_code),
    "dayLow": format_currency(info.get('dayLow'), symbol, rate, country_code),
    "fiftyTwoWeekHigh": format_currency(info.get('fiftyTwoWeekHigh'), symbol, rate, country_code),
    "fiftyTwoWeekLow": format_currency(info.get('fiftyTwoWeekLow'), symbol, rate, country_code),
    "marketCap": format_currency(info.get('marketCap'), symbol, rate, country_code),
    "sharesOutstanding": f"{info.get('sharesOutstanding', 0):,}주" if info.get('sharesOutstanding') else "-",
    "volume": f"{info.get('volume', 0):,}주" if info.get('volume') else "-",
  }
    
def format_analyst_recommendations(info: dict, symbol: str = None, rate: float = 1300.0, country_code: str = None) -> dict:
  """분석가 의견을 API 응답 포맷으로 변환"""
  return {
    "recommendationMean": info.get('recommendationMean', 0),
    "recommendationKey": info.get('recommendationKey', 'N/A').upper(),
    "numberOfAnalystOpinions": info.get('numberOfAnalystOpinions', 0),
    "targetMeanPrice": format_currency(info.get('targetMeanPrice'), symbol or 'UNKNOWN', rate, country_code),
    "targetHighPrice": format_currency(info.get('targetHighPrice'), symbol or 'UNKNOWN', rate, country_code),
    "targetLowPrice": format_currency(info.get('targetLowPrice'), symbol or 'UNKNOWN', rate, country_code),
  }

def format_financial_statement_response(df_raw: pd.DataFrame, statement_type: str, symbol: str) -> dict:
  """재무제표를 API 응답 포맷으로 변환 (한국 주식 처리 추가)"""
  trans_map = {"income": INCOME_KR, "balance": BALANCE_KR, "cashflow": CASHFLOW_KR}.get(statement_type, {})
  is_korean_stock = symbol.upper().endswith(('.KS', '.KQ'))
  currency_prefix = "₩" if is_korean_stock else "$"

  years = [str(y.year) for y in df_raw.columns]
  formatted_rows = []
  
  for k, v in trans_map.items():
    if k in df_raw.index:
      row_data = {"item": v}
      for col in df_raw.columns:
        val = df_raw.loc[k, col]
        if pd.notnull(val):
          unit, value = _classify_unit(abs(val))
          value_str = f"{value:,.0f}" # 재무제표는 정수로 표현
          formatted = f"{currency_prefix}{'-' if val < 0 else ''}{value_str}{unit}"
          row_data[str(col.year)] = formatted
        else:
          row_data[str(col.year)] = '-'
      formatted_rows.append(row_data)
          
  return {"years": years, "data": formatted_rows}

def process_price_dataframe(df: pd.DataFrame) -> pd.DataFrame:
  """주가 데이터프레임을 API 응답에 맞게 처리"""
  if df.empty:
    return pd.DataFrame()
  
  df = df.reset_index()
  df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
  df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
  
  final_cols = ["Date", "Close", "High", "Low", "Open", "Volume"]
  return df[[c for c in final_cols if c in df.columns]]