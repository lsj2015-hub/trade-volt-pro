import logging
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.external.yahoo_finance import yahoo_finance
from app.external.translation import tranlation_service
from app.utils.formatting import (
  format_stock_profile, format_financial_summary, format_investment_metrics,
  format_market_data, format_analyst_recommendations, format_currency
)

logger = logging.getLogger(__name__)

class AnalysisService:
  """종목 분석 서비스 - Yahoo Finance API 기반"""
  
  def get_company_summary(self, symbol: str, country_code: str, company_name: str = "", exchange_code: str = None) -> Optional[Dict]:
    """Company Summary 정보 조회"""
    try:
      logger.info(f"Company Summary 조회 시작: symbol={symbol}, country_code={country_code}, exchange_code={exchange_code}")
      
      # Yahoo Finance에서 데이터 조회
      yahoo_info = yahoo_finance.get_stock_info(symbol, country_code, exchange_code)
      if not yahoo_info:
        logger.warning(f"Yahoo Finance에서 '{symbol}' 정보를 찾을 수 없습니다.")
        return None
      
      # 데이터 결합
      combined_info = {
        "symbol": symbol,
        "longName": company_name or yahoo_info.get("longName", ""),
        **yahoo_info
      }

      # 사업개요 번역 처리
      business_summary_en = yahoo_info.get('longBusinessSummary', '')
      business_summary_kr = ""
      
      if business_summary_en:
        logger.info(f"사업개요 번역 시작: {symbol}")
        try:
          business_summary_kr = tranlation_service.translate_to_korean(business_summary_en)
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
  
  def get_financial_summary(self, symbol: str, db: Session, exchange_rate: float) -> Optional[Dict]:
    """Financial Summary 정보 조회"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # country_code 추출
      country_code = combined_info.get('countryCode')
      return format_financial_summary(combined_info, symbol, exchange_rate, country_code)
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
  
  def get_market_info(self, symbol: str, db: Session, exchange_rate: float) -> Optional[Dict]:
    """Market Info 정보 조회"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # country_code 추출
      country_code = combined_info.get('countryCode')
      return format_market_data(combined_info, symbol, exchange_rate, country_code)
    except Exception as e:
      logger.error(f"Market Info 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  def get_analyst_opinion(self, symbol: str, db: Session) -> Optional[Dict]:
    """Analyst Opinion 정보 조회"""
    try:
      combined_info = yahoo_finance.get_stock_info_combined(symbol, db)
      if not combined_info:
        return None
      
      # country_code 추출하여 전달
      country_code = combined_info.get('countryCode')
      return format_analyst_recommendations(combined_info, symbol, 1300.0, country_code)
    except Exception as e:
      logger.error(f"Analyst Opinion 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None
  
  def get_major_executors(self, symbol: str, exchange_rate: float, exchange_code: str = None, country_code: str = None) -> Optional[Dict]:
    """Major Executors (임원진) 정보 조회"""
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
        officer_info = {
          "name": officer.get("name", ""),
          "title": officer.get("title", ""),
          "totalPay": format_currency(officer.get("totalPay"), symbol, exchange_rate, country_code),
          "age": officer.get("age"),
          "yearBorn": officer.get("yearBorn")
        }
        formatted_officers.append(officer_info)
      
      result = {"officers": formatted_officers}
      logger.info(f"Major Executors 조회 완료: {symbol}")
      return result
      
    except Exception as e:
      logger.error(f"Major Executors 조회 오류 (symbol: {symbol}): {e}", exc_info=True)
      return None

# 싱글톤 인스턴스
analysis_service = AnalysisService()