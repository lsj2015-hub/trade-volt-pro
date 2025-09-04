import yfinance as yf
import pandas as pd
import logging
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.stock import Stock

logger = logging.getLogger(__name__)

class YahooFinance:
  def _get_yahoo_symbol_with_suffix(self, symbol: str, exchange_code: str = None) -> str:
    """Yahoo Finance용 심볼 suffix 처리 (주가/뉴스 공통 사용)"""
    try:
      # Yahoo Finance suffix 매핑
      yahoo_suffix_map = {
        # 한국
        "KOSPI": ".KS",
        "KOSDAQ": ".KQ",
        
        # 미국 (suffix 없음)
        "NYSE": "",
        "NASDAQ": "",
        "AMEX": "",
        
        # 일본
        "TSE": ".T",
        
        # 홍콩
        "HKS": ".HK",
        
        # 중국
        "SHS": ".SS",
        "SZS": ".SZ",
        
        # 베트남
        "HNX": ".VN",
        "HSX": ".VN",
      }
      
      if not exchange_code:
        return symbol
      
      if exchange_code not in yahoo_suffix_map:
        logger.warning(f"지원하지 않는 거래소: '{exchange_code}'. 원본 심볼 사용: {symbol}")
        return symbol
      
      suffix = yahoo_suffix_map[exchange_code]
      
      # 거래소별 심볼 포맷 처리
      if exchange_code in ["KOSPI", "KOSDAQ"]:
        # 한국: 6자리 숫자 (005930)
        if symbol.isdigit():
          formatted_symbol = symbol.zfill(6)  # 6자리로 패딩
        else:
          formatted_symbol = symbol
        ticker_symbol = f"{formatted_symbol}{suffix}"
        
      elif exchange_code in ["NYSE", "NASDAQ", "AMEX"]:
        # 미국: 문자 심볼, suffix 없음
        ticker_symbol = symbol
        
      elif exchange_code == "TSE":
        # 일본: 보통 4자리 숫자 (7203)
        if symbol.isdigit():
          formatted_symbol = symbol.zfill(4)  # 4자리로 패딩
        else:
          formatted_symbol = symbol
        ticker_symbol = f"{formatted_symbol}{suffix}"
        
      elif exchange_code == "HKS":
        # 홍콩: 4자리 숫자 (0700)
        if symbol.isdigit():
          formatted_symbol = symbol.zfill(4)  # 4자리로 패딩
        else:
          formatted_symbol = symbol
        ticker_symbol = f"{formatted_symbol}{suffix}"
        
      elif exchange_code in ["SHS", "SZS"]:
        # 중국: 6자리 숫자 (000001)
        if symbol.isdigit():
          formatted_symbol = symbol.zfill(6)  # 6자리로 패딩
        else:
          formatted_symbol = symbol
        ticker_symbol = f"{formatted_symbol}{suffix}"
        
      elif exchange_code in ["HNX", "HSX"]:
        ticker_symbol = f"{symbol}{suffix}"
        
      else:
        # 기본: suffix만 추가
        ticker_symbol = f"{symbol}{suffix}" if suffix else symbol
      
      logger.debug(f"심볼 포맷팅: {symbol} → {ticker_symbol} ({exchange_code})")
      return ticker_symbol
      
    except Exception as e:
      logger.error(f"심볼 포맷팅 오류: {e}")
      return symbol

  def _get_yfinance_ticker_with_suffix(self, symbol: str, exchange_code: str = None) -> yf.Ticker | None:
    """실제 DB 거래소 코드 기반 Yahoo Finance 심볼 suffix 처리"""
    try:
      if not exchange_code:
        ticker = yf.Ticker(symbol)
        return ticker
      
      ticker_symbol = self._get_yahoo_symbol_with_suffix(symbol, exchange_code)
      
      if not ticker_symbol:
        raise ValueError(f"지원하지 않는 거래소입니다: '{exchange_code}'")
      
      ticker = yf.Ticker(ticker_symbol)
      
      # 유효성 검증
      if ticker.info.get('regularMarketPrice') is not None:
        return ticker
      else:
        logger.warning(f"'{ticker_symbol}'의 시장 가격 정보를 찾을 수 없습니다.")
        return None
        
    except ValueError:
      raise  # ValueError는 그대로 재발생
    except Exception as e:
      logger.error(f"Yahoo Finance 조회 중 예외 발생 (symbol: {symbol}, exchange_code: {exchange_code}): {e}")
      return None

  def get_stock_info_combined(self, symbol: str, db: Session) -> dict | None:
    """DB 정보와 Yahoo Finance 정보를 결합한 종목 정보 조회"""
    try:
      # DB에서 종목 정보 조회
      stock_info = db.query(Stock).filter(Stock.symbol == symbol).first()
      if not stock_info:
        logger.warning(f"DB에서 종목 '{symbol}' 정보를 찾을 수 없습니다.")
        return None
        
      # 기본 정보 설정 (DB에서 가져온 정보)
      combined_info = {
        "symbol": stock_info.symbol,
        "longName": stock_info.company_name,
        "longNameEn": stock_info.company_name_en,
        "currency": stock_info.currency,
        "sector": stock_info.sector,
        "industry": stock_info.industry,
        "exchangeCode": stock_info.exchange_code,
        "countryCode": stock_info.country_code
      }
      
      # yfinance에서 추가 정보 가져오기
      try:
        yfs_ticker = self._get_yfinance_ticker_with_suffix(symbol, stock_info.exchange_code)
        if yfs_ticker and yfs_ticker.info: 
          combined_info.update(yfs_ticker.info)
          
          # 시가총액 정보 추가
          if 'marketCap' in yfs_ticker.info and yfs_ticker.info['marketCap']:
            combined_info['marketCap'] = yfs_ticker.info['marketCap']
          elif ('sharesOutstanding' in yfs_ticker.info and 'regularMarketPrice' in yfs_ticker.info 
                and yfs_ticker.info['sharesOutstanding'] and yfs_ticker.info['regularMarketPrice']):
            combined_info['marketCap'] = yfs_ticker.info['sharesOutstanding'] * yfs_ticker.info['regularMarketPrice']
      except ValueError as e:
        logger.error(f"주식 '{symbol}' yfinance 조회 실패: {e}")
        return None
      
      return combined_info
    except Exception as e:
      logger.error(f"주식 정보 조합 중 오류 발생 ('{symbol}'): {e}", exc_info=True)
      return None

  def get_stock_info(self, symbol: str, exchange_code: str = None) -> dict | None:
    """DB 조회 없이 symbol과 exchange_code로 Yahoo Finance 데이터 조회"""
    try:
      # exchange_code가 있으면 항상 포맷팅 적용
      if exchange_code:
        try:
          yfs_ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"'{symbol}' 조회 실패 (거래소: {exchange_code}): {e}")
          return None
      else:
        # exchange_code가 없으면 직접 조회 (미국 주식 등)
        yfs_ticker = yf.Ticker(symbol)
      
      if yfs_ticker and yfs_ticker.info:
        return yfs_ticker.info
      return None
    except Exception as e:
      logger.error(f"Yahoo Finance 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None

  def get_officers(self, symbol: str, exchange_code: str = None) -> list | None:
    """임원진 정보 조회"""
    try:
      # exchange_code가 있으면 항상 _get_yfinance_ticker_with_suffix 사용
      if exchange_code:
        try:
          ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"임원진 조회 실패: {e}")
          return None
      else:
        # exchange_code가 없으면 기존 로직
        if len(symbol) == 6 and symbol.isdigit():
          logger.warning(f"한국 주식으로 추정되지만 exchange_code가 없습니다: {symbol}")
          return None
        else:
          ticker = yf.Ticker(symbol)
      
      if ticker and ticker.info:
        officers = ticker.info.get("companyOfficers")
        return officers
      return None
    except Exception as e:
      logger.error(f"Officers 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None

  def get_financials(self, symbol: str, exchange_code: str = None) -> dict | None:
    """재무제표 조회"""
    try:
      # exchange_code가 있으면 항상 _get_yfinance_ticker_with_suffix 사용
      if exchange_code:
        try:
          yfs_ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"재무제표 조회 실패: {e}")
          return None
      else:
        # exchange_code가 없으면 기존 로직
        if len(symbol) == 6 and symbol.isdigit():
          logger.warning(f"한국 주식으로 추정되지만 exchange_code가 없습니다: {symbol}")
          return None
        else:
          yfs_ticker = yf.Ticker(symbol)
        
      if not yfs_ticker: 
        return None
      
      income = yfs_ticker.financials
      balance = yfs_ticker.balance_sheet
      cashflow = yfs_ticker.cashflow

      if all(df is None or df.empty for df in [income, balance, cashflow]):
        logger.warning(f"yfinance: '{symbol}'에 대한 재무제표 데이터가 모두 비어있습니다.")
        return None

      items_to_exclude = ['Treasury Shares Number', 'Ordinary Shares Number', 'Share Issued']
      
      if not income.empty: income = income[income.columns[::-1]]
      if not cashflow.empty: cashflow = cashflow[cashflow.columns[::-1]]
      if not balance.empty:
        balance = balance[balance.columns[::-1]]
        balance = balance.drop(items_to_exclude, errors='ignore')

      return {'income': income, 'balance': balance, 'cashflow': cashflow}
    except Exception as e:
      logger.error(f"yfinance: '{symbol}' 재무제표 조회 중 예외 발생: {e}", exc_info=True)
      return None
          
  def get_price_history(self, symbol: str, start: str, end: str, exchange_code: str = None) -> tuple[pd.DataFrame | None, str | None]:
    """주가 히스토리 조회"""
    try:
      # exchange_code가 있으면 포맷팅 적용
      if exchange_code:
        try:
          # _get_yfinance_ticker_with_suffix에서 사용하는 것과 동일한 로직 적용
          ticker_obj = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
          if ticker_obj:
            # ticker 객체에서 symbol 추출 (예: 0700.HK)
            symbol_with_suffix = ticker_obj.ticker
          else:
            return None, None
        except ValueError as e:
          logger.error(f"주가 히스토리 조회 실패: {e}")
          return None, None
      else:
        symbol_with_suffix = symbol
        
      df = yf.download(symbol_with_suffix, start=start, end=end, progress=False, auto_adjust=True)
      if df.empty: return None, None
      df.reset_index(inplace=True)
      df.rename(columns={'Date': 'Date', 'Open': 'Open', 'High': 'High', 'Low': 'Low', 'Close': 'Close', 'Volume': 'Volume'}, inplace=True)
      return df, df['Date'].max().strftime("%Y-%m-%d")
    except Exception as e:
      logger.error(f"yfinance: '{symbol}' 가격 조회 중 예외 발생: {e}", exc_info=True)
      return None, None
  
  def get_comparison_data(self, tickers: list, start: str, end: str) -> pd.DataFrame | None:
    """종목 비교 데이터 조회"""
    try:
      data = yf.download(tickers, start=start, end=end, progress=False, auto_adjust=True)
      if data.empty or 'Close' not in data:
        return None
      close_prices = data['Close']
      if isinstance(close_prices, pd.Series):
          close_prices = close_prices.to_frame(name=tickers[0])
      close_prices.dropna(axis=1, how='all', inplace=True)
      if close_prices.empty:
        return None
      first_valid_prices = close_prices.bfill().iloc[0]
      normalized_prices = (close_prices / first_valid_prices) * 100
      return normalized_prices
    except Exception as e:
      logger.error(f"yfinance: 비교 데이터 처리 중 예외 발생: {e}", exc_info=True)
      return None

  async def get_news_from_rss(self, symbol: str, start_date: str, end_date: str, exchange_code: str = None, limit: int = 50) -> List[Dict]:
    """Yahoo Finance RSS에서 뉴스 조회"""
    # 올바른 심볼 형태로 변환
    formatted_symbol = self._get_yahoo_symbol_with_suffix(symbol, exchange_code)
    url = f"https://finance.yahoo.com/rss/headline?s={formatted_symbol}"
    
    # 실제 브라우저처럼 보이도록 User-Agent 헤더 설정
    headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    news_list = []

    logger.info(f"뉴스 서비스 시작: '{symbol}' → '{formatted_symbol}', URL: {url}")

    try:
      async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=15, follow_redirects=True)
      
      logger.info(f"뉴스 서비스 '{formatted_symbol}': 응답 상태 코드 {response.status_code}")
      response.raise_for_status()

      # 디버깅: 응답 내용 확인 (첫 500자)
      logger.debug(f"뉴스 응답 내용 (처음 500자): {response.content[:500]}")

      root = ET.fromstring(response.content)
      
      # 날짜 범위 처리
      try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # 최대 7일 제한 검증
        if (end_dt - start_dt).days > 7:
          logger.warning(f"뉴스 조회 기간이 7일을 초과함: {start_date} ~ {end_date}")
          start_dt = end_dt - timedelta(days=7)
          logger.info(f"시작일을 7일 전으로 조정: {start_dt}")
        
        logger.info(f"뉴스 필터링 기간: {start_dt} ~ {end_dt}")
        
      except ValueError as e:
        logger.error(f"날짜 형식 오류: start_date={start_date}, end_date={end_date}, error={e}")
        # 기본값으로 오늘 날짜 설정
        today = datetime.now(timezone.utc).date()
        start_dt = end_dt = today
      
      item_count = 0
      filtered_count = 0
      
      for item in root.findall('./channel/item'):
        item_count += 1
        title = item.findtext('title', '')
        pub_date_str = item.findtext('pubDate', None)

        published_date_iso = None
        is_in_range = False
        
        if pub_date_str:
          try:
            # RFC 822 형식을 파싱
            dt_object = datetime.strptime(pub_date_str, '%a, %d %b %Y %H:%M:%S %z')
            published_date_iso = dt_object.isoformat()
            
            # 날짜 범위 비교 (UTC 기준)
            news_date = dt_object.astimezone(timezone.utc).date()
            is_in_range = start_dt <= news_date <= end_dt
            
          except (ValueError, TypeError) as e:
            logger.warning(f"뉴스 날짜 파싱 오류: '{pub_date_str}', 에러: {e}")
            published_date_iso = None
            is_in_range = False

        # 지정 기간 뉴스만 추가
        if is_in_range:
          news_list.append({
            "title": title,
            "url": item.findtext('link', '#'),
            "publishedDate": published_date_iso,
            "source": "Yahoo Finance RSS",
            "summary": item.findtext('description', '')
          })
          filtered_count += 1
          
          # limit 도달 시 중단
          if len(news_list) >= limit:
            break

      logger.info(f"뉴스 서비스 '{formatted_symbol}': 총 {item_count}개 아이템 발견, {filtered_count}개가 {start_dt} ~ {end_dt} 기간으로 필터링됨.")
      
      if item_count == 0:
        logger.warning(f"뉴스 서비스 '{formatted_symbol}': XML 데이터에서 <item> 태그를 찾지 못했습니다. 응답 구조가 변경되었거나 내용이 비어있을 수 있습니다.")

      return news_list

    except httpx.RequestError as e:
      logger.error(f"뉴스 서비스 '{formatted_symbol}': HTTP 요청 중 에러 발생: {e.__class__.__name__} - {e}", exc_info=True)
      return []
    except httpx.HTTPStatusError as e:
      logger.error(f"뉴스 서비스 '{formatted_symbol}': 야후 파이낸스에서 에러 응답: 상태 코드 {e.response.status_code}", exc_info=True)
      return []
    except ET.ParseError as e:
      logger.error(f"뉴스 서비스 '{formatted_symbol}': XML 파싱 에러: {e}", exc_info=True)
      return []
    except Exception as e:
      logger.error(f"뉴스 서비스 '{formatted_symbol}': 예상치 못한 에러 발생: {e.__class__.__name__} - {e}", exc_info=True)
      return []

# 싱글톤 인스턴스
yahoo_finance = YahooFinance()