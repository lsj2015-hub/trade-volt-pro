import logging
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.external.yahoo_finance import yahoo_finance
from app.external.translation import translation_service
from app.utils.formatting import (
  format_stock_profile, format_investment_metrics, format_financial_statement_response, format_analyst_recommendations, format_financial_summary
)

logger = logging.getLogger(__name__)

class AnalysisService:
  """종목 분석 서비스 - Yahoo Finance API 기반"""
  
  def get_company_summary(self, symbol: str, country_code: str, company_name: str = "", exchange_code: str = None) -> Optional[Dict]:
    """Company Summary 정보 조회 (다국가 거래소 지원)"""
    try:
      logger.info(f"Company Summary 조회 시작: symbol={symbol}, country_code={country_code}, exchange_code={exchange_code}")
    
      # 지원 거래소 체크
      supported_exchanges = ["KOSPI", "KOSDAQ", "NYSE", "NASDAQ", "AMEX", "TSE", "HKS", "SHS", "SZS", "HNX", "HSX"]
      if exchange_code and exchange_code not in supported_exchanges:
        logger.error(f"지원하지 않는 거래소: {exchange_code}")
        return None
      
      # Yahoo Finance에서 데이터 조회 (exchange_code 전달)
      yahoo_info = yahoo_finance.get_stock_info(symbol, exchange_code)
      if not yahoo_info:
        logger.warning(f"Yahoo Finance에서 '{symbol}' 정보를 찾을 수 없습니다.")
        return None
      
      # 데이터 결합
      combined_info = {
        "symbol": symbol,
        "long_name": company_name or yahoo_info.get("long_name", ""),
        **yahoo_info
      }

      # 사업개요 번역 처리
      business_summary_en = yahoo_info.get('longBusinessSummary', '')
      business_summary_kr = ""
      
      if business_summary_en:
        logger.info(f"사업개요 번역 시작: {symbol}")
        try:
          business_summary_kr = translation_service.translate_text(business_summary_en)
          logger.info(f"사업개요 번역 완료: {symbol}")
        except Exception as e:
          logger.error(f"사업개요 번역 실패: {e}")
          business_summary_kr = business_summary_en  # 번역 실패 시 원문 사용
      
      result = format_stock_profile(combined_info, business_summary_kr)
      
      logger.info(f"Company Summary 조회 완료: {symbol}")
      return result
      
    except Exception as e:
      logger.error(f"Company Summary 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  async def get_financial_summary(self, symbol: str, db: Session, exchange_code: str = None) -> Optional[Dict]:
    """Financial Summary 정보 조회 (다국가 거래소 지원)"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # exchange_code 우선, 없으면 DB에서 추출
      if not exchange_code:
        exchange_code = combined_info.get('exchange_code')
      
      if not exchange_code:
        logger.error(f"거래소 정보를 찾을 수 없습니다: {symbol}")
        return None
      
      # ✅ 수정: symbol 파라미터 제거
      return await format_financial_summary(combined_info, exchange_code)
    except Exception as e:
      logger.error(f"Financial Summary 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  def get_investment_index(self, symbol: str, db: Session) -> Optional[Dict]:
    """Investment Index 정보 조회"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      return format_investment_metrics(combined_info)
    except Exception as e:
      logger.error(f"Investment Index 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  async def get_market_info(self, symbol: str, db: Session, exchange_code: str = None) -> Optional[Dict]:
    """Market Info 정보 조회 (다국가 거래소 지원)"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # exchange_code 우선, 없으면 DB에서 추출
      if not exchange_code:
        exchange_code = combined_info.get('exchange_code')
      
      if not exchange_code:
        logger.error(f"거래소 정보를 찾을 수 없습니다: {symbol}")
        return None
      
      from app.utils.formatting import format_market_data
      # ✅ 수정: symbol 파라미터 제거
      return await format_market_data(combined_info, exchange_code)
    except Exception as e:
      logger.error(f"Market Info 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  async def get_analyst_opinion(self, symbol: str, db: Session, exchange_code: str = None) -> Optional[Dict]:
    """Analyst Opinion 정보 조회 (다국가 거래소 지원)"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # exchange_code 우선, 없으면 DB에서 추출
      if not exchange_code:
        exchange_code = combined_info.get('exchange_code')
      
      if not exchange_code:
        logger.error(f"거래소 정보를 찾을 수 없습니다: {symbol}")
        return None
      
      
      # ✅ 수정: symbol 파라미터 제거
      return await format_analyst_recommendations(combined_info, exchange_code)
    except Exception as e:
      logger.error(f"Analyst Opinion 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  async def get_major_executors(self, symbol: str, exchange_code: str) -> Optional[Dict]:
    """Major Executors (임원진) 정보 조회 (다국가 거래소 지원)"""
    try:
      logger.info(f"Major Executors 조회 시작: symbol={symbol}, exchange_code={exchange_code}")
      
      officers_data = yahoo_finance.get_officers(symbol, exchange_code)
      if not officers_data:
        logger.warning(f"'{symbol}' 임원진 정보가 없습니다.")
        return None
      
      # 급여 기준 상위 5명 선택
      top_officers = sorted(officers_data, key=lambda x: x.get('totalPay', 0), reverse=True)[:5]
      logger.info(f"상위 임원 {len(top_officers)}명 선택")
      
      formatted_officers = []
      for officer in top_officers:
        from app.utils.formatting import format_currency_by_exchange
        
        officer_info = {
          "name": officer.get("name", ""),
          "title": officer.get("title", ""),
          "total_pay": await format_currency_by_exchange(officer.get("totalPay"), exchange_code),
          "age": officer.get("age"),
          "year_born": officer.get("yearBorn")
        }
        formatted_officers.append(officer_info)
      
      result = {"officers": formatted_officers}
      logger.info(f"Major Executors 조회 완료: {symbol}")
      return result
      
    except Exception as e:
      logger.error(f"Major Executors 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
    
  async def get_financial_statements(self, symbol: str, statement_type: str, exchange_code: str = None) -> Optional[Dict]:
    """재무제표 상세 정보 조회 (손익계산서, 대차대조표, 현금흐름표)"""
    try:
      logger.info(f"재무제표 조회 시작: symbol={symbol}, type={statement_type}, exchange_code={exchange_code}")
      
      # Yahoo Finance에서 재무제표 데이터 조회
      financials_data = yahoo_finance.get_financials(symbol, exchange_code)
      if not financials_data:
        logger.warning(f"'{symbol}' 재무제표 데이터를 찾을 수 없습니다.")
        return None
      
      # 요청된 재무제표 타입 선택
      if statement_type == "income":
        df = financials_data.get('income')
      elif statement_type == "balance":
        df = financials_data.get('balance')
      elif statement_type == "cashflow":
        df = financials_data.get('cashflow')
      else:
        logger.error(f"지원하지 않는 재무제표 타입: {statement_type}")
        return None
      
      if df is None or df.empty:
        logger.warning(f"'{symbol}' {statement_type} 데이터가 비어있습니다.")
        return None
      
      # 포맷팅하여 응답 생성
      result = await format_financial_statement_response(df, statement_type, symbol, exchange_code)
      
      logger.info(f"재무제표 조회 완료: {symbol} - {statement_type}")
      return result
      
    except Exception as e:
      logger.error(f"재무제표 조회 오류 (symbol: {symbol}, type: {statement_type}): {e}", exc_info=True)
      return None
    

# 싱글톤 인스턴스
analysis_service = AnalysisService()