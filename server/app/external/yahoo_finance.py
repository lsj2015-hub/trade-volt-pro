import yfinance as yf
import pandas as pd
import logging
from sqlalchemy.orm import Session
from app.models.stock import Stock

logger = logging.getLogger(__name__)

class YahooFinance:
  def _get_yfinance_ticker_with_suffix(self, symbol: str, exchange_code: str = None) -> yf.Ticker | None:
    try:
      if exchange_code == "KOSPI":
        ticker_ks = yf.Ticker(f"{symbol}.KS")
        if ticker_ks.info.get('regularMarketPrice') is not None:
          return ticker_ks
        else:
          logger.warning(f"KOSPI 주식 '{symbol}.KS'의 시장 가격 정보를 찾을 수 없습니다.")
          return None
      elif exchange_code == "KOSDAQ":
        ticker_kq = yf.Ticker(f"{symbol}.KQ")
        if ticker_kq.info.get('regularMarketPrice') is not None:
          return ticker_kq
        else:
          logger.warning(f"KOSDAQ 주식 '{symbol}.KQ'의 시장 가격 정보를 찾을 수 없습니다.")
          return None
      else:
        # 거래소 정보가 없는 경우
        error_msg = f"한국 주식 '{symbol}'에 대한 거래소 정보가 필요합니다. 현재 값: '{exchange_code}'. 'KOSPI' 또는 'KOSDAQ'을 지정해주세요."
        logger.error(error_msg)
        raise ValueError(error_msg)
        
    except ValueError:
      raise  # ValueError는 그대로 재발생
    except Exception as e:
      logger.error(f"Yahoo Finance 조회 중 예외 발생 (symbol: {symbol}, exchange_code: {exchange_code}): {e}")
      return None

  def get_stock_info_combined(self, symbol: str, db: Session) -> dict | None:
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
      
      # yfinance에서 추가 정보 가져오기 (한국 주식인 경우)
      if stock_info.country_code == 'KR':
        try:
          # exchange_code를 전달하여 정확한 거래소로 조회
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
          logger.error(f"한국 주식 '{symbol}' 조회 실패: {e}")
          return None
      else:
        # 해외 주식인 경우 직접 yfinance 조회
        yfs_ticker = yf.Ticker(symbol)
        if yfs_ticker and yfs_ticker.info:
          combined_info.update(yfs_ticker.info)
      
      return combined_info
    except Exception as e:
      logger.error(f"한국 주식 정보 조합 중 오류 발생 ('{symbol}'): {e}", exc_info=True)
      return None

  def get_stock_info(self, symbol: str, country_code: str = None, exchange_code: str = None) -> dict | None:
    """DB 조회 없이 symbol과 country_code, exchange_code로 Yahoo Finance 데이터 조회"""
    try:
      # 한국 주식인 경우 suffix 처리
      if country_code == 'KR' and len(symbol) == 6 and symbol.isdigit():
        try:
          yfs_ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"한국 주식 '{symbol}' 조회 실패: {e}")
          return None
      else:
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
      # 한국 주식인 경우 suffix 처리
      if len(symbol) == 6 and symbol.isdigit():
        try:
          ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"임원진 조회 실패: {e}")
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
    try:
      if len(symbol) == 6 and symbol.isdigit():
        try:
          yfs_ticker = self._get_yfinance_ticker_with_suffix(symbol, exchange_code)
        except ValueError as e:
          logger.error(f"재무제표 조회 실패: {e}")
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
    try:
      # 한국 주식인 경우 suffix 추가
      if len(symbol) == 6 and symbol.isdigit():
        if exchange_code == "KOSPI":
          symbol_with_suffix = f"{symbol}.KS"
        elif exchange_code == "KOSDAQ":
          symbol_with_suffix = f"{symbol}.KQ"
        else:
          logger.error(f"한국 주식 '{symbol}'에 대한 거래소 정보가 필요합니다.")
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
    
# 싱글톤 인스턴스
yahoo_finance = YahooFinance()