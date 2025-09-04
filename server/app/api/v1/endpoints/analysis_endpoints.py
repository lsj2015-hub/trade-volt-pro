from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
import logging
from typing import Optional
import pandas as pd
from datetime import datetime

from app.config.database import get_sync_session
from app.schemas.common_schemas import (
  AnalysisInfoType, AnalysisResponse, CompanySummaryResponse,
  FinancialSummaryResponse, InvestmentIndexResponse, MarketInfoResponse,
  AnalystOpinionResponse, MajorExecutorsResponse, PriceHistoryResponse,
  NewsResponse, TranslateResponse, TranslateRequest, NewsTranslateResponse, 
  NewsTranslateRequest, TranslatedContent, 
  ChatMessage, LLMQuestionRequest, LLMQuestionResponse
)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.analysis_service import analysis_service
from app.external.yahoo_finance import yahoo_finance
from app.external.translation import translation_service
from app.external.llm import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()

# =========================
# 🗑️ 제거된 함수: get_exchange_rate()
# 이제 각 서비스에서 실시간 환율 자동 조회
# =========================

@router.get("/{symbol}", response_model=AnalysisResponse)
async def get_stock_analysis(
  symbol: str,
  info_type: AnalysisInfoType = Query(..., description="조회할 정보 유형"),
  country_code: str = Query("US", description="국가 코드"),
  company_name: str = Query("", description="회사명"),
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """종목 분석 정보 조회 (다국가 거래소 지원)"""
  try:
    logger.info(f"종목 분석 요청: user_id={current_user.id}, symbol={symbol}, info_type={info_type.value}, exchange_code={exchange_code}")
    
    symbol = symbol.upper()
    
    if info_type == AnalysisInfoType.COMPANY_SUMMARY:
      data = analysis_service.get_company_summary(symbol, country_code, company_name, exchange_code)
    elif info_type == AnalysisInfoType.FINANCIAL_SUMMARY:
      data = await analysis_service.get_financial_summary(symbol, db, exchange_code)
    elif info_type == AnalysisInfoType.INVESTMENT_INDEX:
      data = analysis_service.get_investment_index(symbol, db)
    elif info_type == AnalysisInfoType.MARKET_INFO:
      data = await analysis_service.get_market_info(symbol, db, exchange_code)
    elif info_type == AnalysisInfoType.ANALYST_OPINION:
      data = await analysis_service.get_analyst_opinion(symbol, db, exchange_code)
    elif info_type == AnalysisInfoType.MAJOR_EXECUTORS:
      data = await analysis_service.get_major_executors(symbol, exchange_code)
    else:
      raise HTTPException(status_code=400, detail="지원하지 않는 정보 유형입니다.")
    
    if not data:
      raise HTTPException(
        status_code=404,
        detail=f"'{symbol}'에 대한 {info_type.value} 정보를 찾을 수 없습니다."
      )
    
    logger.info(f"종목 분석 완료: user_id={current_user.id}, symbol={symbol}")
    return AnalysisResponse(
      symbol=symbol,
      info_type=info_type.value,
      data=data,
      success=True
    )
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"종목 분석 조회 오류 (symbol: {symbol}, type: {info_type}): {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")

@router.get("/{symbol}/company-summary", response_model=CompanySummaryResponse)
async def get_company_summary(
  symbol: str,
  country_code: str = Query("US", description="국가 코드"),
  company_name: str = Query("", description="회사명"),
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user)
):
  """회사 기본 정보 조회"""
  try:
    logger.info(f"회사 정보 요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = analysis_service.get_company_summary(symbol.upper(), country_code, company_name, exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 회사 정보를 찾을 수 없습니다.")
    
    logger.info(f"회사 정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
    
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"회사 정보 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="회사 정보 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/financial-summary", response_model=FinancialSummaryResponse)
async def get_financial_summary(
  symbol: str,
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """재무 요약 정보 조회 (다국가 거래소 지원)"""
  try:
    logger.info(f"재무요약 정보요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = await analysis_service.get_financial_summary(symbol.upper(), db, exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 재무 정보를 찾을 수 없습니다.")
    
    logger.info(f"재무요약 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"재무요약 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="재무요약 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/investment-index", response_model=InvestmentIndexResponse)
async def get_investment_index(
  symbol: str,
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """투자 지표 조회 (환율 무관)"""
  try:
    logger.info(f"투자지표 정보요청: user_id={current_user.id}, symbol={symbol}")
    
    data = analysis_service.get_investment_index(symbol.upper(), db)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 투자지표를 찾을 수 없습니다.")
    
    logger.info(f"투자지표 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"투자지표 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="투자지표 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/market-info", response_model=MarketInfoResponse)
async def get_market_info(
  symbol: str,
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """시장 정보 조회 (다국가 거래소 지원)"""
  try:
    logger.info(f"시장정보 정보요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = await analysis_service.get_market_info(symbol.upper(), db, exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 시장 정보를 찾을 수 없습니다.")
    
    logger.info(f"시장정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data

  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"시장정보 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="시장정보 조회 중 오류가 발생했습니다.")
  
@router.get("/{symbol}/analyst-opinion", response_model=AnalystOpinionResponse)
async def get_analyst_opinion(
  symbol: str,
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_sync_session)
):
  """애널리스트 의견 조회 (다국가 거래소 지원)"""
  try:
    logger.info(f"애널리스트 정보요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = await analysis_service.get_analyst_opinion(symbol.upper(), db, exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 애널리스트 정보를 찾을 수 없습니다.")
    
    logger.info(f"애널리스트 의견 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"애널리스트 의견 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="애널리스트 의견 조회 중 오류가 발생했습니다.")

@router.get("/{symbol}/major-executors", response_model=MajorExecutorsResponse)
async def get_major_executors(
  symbol: str,
  exchange_code: str = Query(None, description="거래소 코드 (KOSPI/KOSDAQ/NYSE/NASDAQ 등)"),
  current_user: User = Depends(get_current_user)
):
  """주요 임원진 조회 (다국가 거래소 지원)"""
  try:
    logger.info(f"주요 임원진 정보요청: user_id={current_user.id}, symbol={symbol}, exchange_code={exchange_code}")
    
    data = await analysis_service.get_major_executors(symbol.upper(), exchange_code)
    if not data:
      raise HTTPException(status_code=404, detail=f"'{symbol}' 임원진 정보를 찾을 수 없습니다.")
    
    logger.info(f"임원진 정보 조회 완료: user_id={current_user.id}, symbol={symbol}")
    return data
  
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"주요 임원진 조회 오류: user_id={current_user.id}, symbol={symbol}, error={str(e)}")
    raise HTTPException(status_code=500, detail="주요 임원진 조회 중 오류가 발생했습니다.")
  
@router.get("/{symbol}/financial-statements/{statement_type}")
async def get_financial_statements(
    symbol: str,
    statement_type: str,
    exchange_code: Optional[str] = Query(None, description="거래소 코드 (KOSPI, KOSDAQ 등)"),
):
    """
    재무제표 상세 조회
    - statement_type: income (손익계산서), balance (대차대조표), cashflow (현금흐름표)
    """
    try:
        if statement_type not in ["income", "balance", "cashflow"]:
            raise HTTPException(status_code=400, detail="지원하지 않는 재무제표 타입입니다. (income, balance, cashflow)")
        
        logger.info(f"재무제표 API 호출: {symbol} - {statement_type}")
        
        result = await analysis_service.get_financial_statements(symbol, statement_type, exchange_code)
        
        if not result:
            raise HTTPException(status_code=404, detail="재무제표 데이터를 찾을 수 없습니다.")
            
        return {"success": True, "data": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"재무제표 API 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="재무제표 조회 중 오류가 발생했습니다.")
    
@router.get("/{symbol}/price-history", response_model=PriceHistoryResponse)
async def get_price_history(
    symbol: str,
    start_date: str = Query(..., description="시작일 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="종료일 (YYYY-MM-DD)"),
    exchange_code: Optional[str] = Query(None, description="거래소 코드 (KOSPI, KOSDAQ 등)"),
    current_user: User = Depends(get_current_user)
):
    """
    주가 히스토리 조회
    - start_date, end_date: YYYY-MM-DD 형식
    - exchange_code: 거래소 코드 (없으면 심볼 그대로 사용)
    """
    try:
        logger.info(f"주가 히스토리 API 호출: user_id={current_user.id}, symbol={symbol}, start={start_date}, end={end_date}, exchange={exchange_code}")
        
        # 날짜 형식 검증
        from datetime import datetime
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            
            if start_dt >= end_dt:
                raise HTTPException(status_code=400, detail="시작일은 종료일보다 이전이어야 합니다.")
                
        except ValueError:
            raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.")
        
        # Yahoo Finance에서 주가 데이터 조회
        from app.external.yahoo_finance import yahoo_finance
        df, last_date = yahoo_finance.get_price_history(symbol.upper(), start_date, end_date, exchange_code)
        
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="해당 기간의 주가 데이터를 찾을 수 없습니다.")
        
        # DataFrame 컬럼 정리 및 JSON 변환
        # MultiIndex 컬럼 처리
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        
        # 필요한 컬럼만 선택하고 이름 정리
        required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        df_clean = df[required_columns].copy()
        
        # 날짜를 문자열로 변환
        df_clean['Date'] = df_clean['Date'].astype(str)
        
        # 숫자형 컬럼을 적절한 타입으로 변환
        for col in ['Open', 'High', 'Low', 'Close']:
            df_clean[col] = df_clean[col].astype(float)
        df_clean['Volume'] = df_clean['Volume'].astype(int)
        
        # JSON으로 변환
        price_data = df_clean.to_dict('records')
        
        result = {
            "success": True,
            "symbol": symbol.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "exchange_code": exchange_code,
            "last_available_date": last_date,
            "data_count": len(price_data),
            "data": price_data
        }
        
        logger.info(f"주가 히스토리 조회 완료: symbol={symbol}, 데이터 수={len(price_data)}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"주가 히스토리 조회 오류: symbol={symbol}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="주가 히스토리 조회 중 오류가 발생했습니다.")
    
@router.get("/{symbol}/news", response_model=NewsResponse)
async def get_stock_news(
  symbol: str = Path(..., description="종목 코드"),
  exchange_code: Optional[str] = Query(None, description="거래소 코드"),
  start_date: str = Query(..., description="시작일 (YYYY-MM-DD)"),
  end_date: str = Query(..., description="종료일 (YYYY-MM-DD)"),
  limit: int = Query(50, ge=1, le=100, description="최대 뉴스 개수"),
  current_user: User = Depends(get_current_user)
) -> NewsResponse:
  """종목별 뉴스 조회"""
  try:
    logger.info(f"종목 뉴스 요청: user_id={current_user.id}, symbol={symbol}, start_date={start_date}, end_date={end_date}")
    
    # Yahoo Finance RSS에서 뉴스 조회
    news_data = await yahoo_finance.get_news_from_rss(
      symbol=symbol.upper(), 
      start_date=start_date, 
      end_date=end_date,
      exchange_code=exchange_code,
      limit=limit
    )
    
    if not news_data:
      logger.warning(f"뉴스 데이터 없음: symbol={symbol}")
      return NewsResponse(
        success=True,
        symbol=symbol.upper(),
        start_date=start_date,
        end_date=end_date,
        news_count=0,
        data=[],
        message="해당 기간의 뉴스가 없습니다."
      )
    
    logger.info(f"종목 뉴스 조회 완료: symbol={symbol}, count={len(news_data)}")
    
    return NewsResponse(
      success=True,
      symbol=symbol.upper(),
      start_date=start_date,
      end_date=end_date,
      news_count=len(news_data),
      data=news_data,
      message=f"{len(news_data)}개의 뉴스를 찾았습니다."
    )
    
  except Exception as e:
    logger.error(f"종목 뉴스 조회 중 오류: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="뉴스 조회 중 오류가 발생했습니다.")
  
@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
  request: TranslateRequest,
  current_user: User = Depends(get_current_user)
) -> TranslateResponse:
  """텍스트 번역"""
  try:
    logger.info(f"번역 요청: user_id={current_user.id}, text_length={len(request.text)}, target_lang={request.target_lang}")
    
    translated_text = translation_service.translate_text(
      request.text, 
      request.source_lang, 
      request.target_lang
    )
    
    logger.info(f"번역 완료: user_id={current_user.id}, target_lang={request.target_lang}")
    
    return TranslateResponse(
      success=True,
      original_text=request.text,
      translated_text=translated_text,
      source_lang=request.source_lang,
      target_lang=request.target_lang,
      message="번역이 완료되었습니다."
    )
    
  except Exception as e:
    logger.error(f"번역 API 오류: user_id={current_user.id}, error={e}")
    raise HTTPException(status_code=500, detail="번역 중 오류가 발생했습니다.")

@router.post("/translate-news", response_model=NewsTranslateResponse)
async def translate_news(
  request: NewsTranslateRequest,
  current_user: User = Depends(get_current_user)
) -> NewsTranslateResponse:
  """뉴스 번역 (제목 + 요약 동시 번역)"""
  try:
    logger.info(f"뉴스 번역 요청: user_id={current_user.id}, target_lang={request.target_lang}")
  
    # 제목 번역
    translated_title = translation_service.translate_text(
      request.original.title, 
      'auto', 
      request.target_lang
    )
    
    # 요약 번역 (있는 경우만)
    translated_summary = ""
    if request.original.summary:
      translated_summary = translation_service.translate_text(
        request.original.summary, 
        'auto', 
        request.target_lang
      )
    
    logger.info(f"뉴스 번역 완료: user_id={current_user.id}, target_lang={request.target_lang}")
    
    return NewsTranslateResponse(
      success=True,
      original=request.original,
      translated=TranslatedContent(
        title=translated_title,
        summary=translated_summary
      ),
      target_lang=request.target_lang,
      message="뉴스 번역이 완료되었습니다."
    )
    
  except Exception as e:
    logger.error(f"뉴스 번역 API 오류: user_id={current_user.id}, error={e}")
    raise HTTPException(status_code=500, detail="뉴스 번역 중 오류가 발생했습니다.")
  
@router.post("/{symbol}/ask-david", response_model=LLMQuestionResponse)
async def ask_david_question(
  request_data: LLMQuestionRequest,
  symbol: str = Path(..., description="종목 코드"),
  current_user: User = Depends(get_current_user)
) -> LLMQuestionResponse:
  """David AI에게 질문하기"""
  try:
    logger.info(f"David 질문 요청: user_id={current_user.id}, symbol={symbol}")
    
    # 클라이언트에서 전달받은 실제 데이터 사용
    company_data = request_data.company_data or ""
    financial_data = request_data.financial_data or ""
    history_data = request_data.price_history_data or ""
    news_data = request_data.news_data or ""

    # 디버깅 로그 추가
    logger.info(f"=== David AI 수신 데이터 ===")
    logger.info(f"Company Data Length: {len(company_data)}")
    logger.info(f"Financial Data Length: {len(financial_data)}")
    logger.info(f"History Data Length: {len(history_data)}")
    logger.info(f"News Data Length: {len(news_data)}")
    logger.info(f"Company Data Preview: {company_data[:200]}...")
    
    # 대화 히스토리 변환
    conversation_history = []
    if request_data.conversation_history:
      conversation_history = [
        {
          "role": msg.role,
          "content": msg.content
        }
        for msg in request_data.conversation_history
      ]
    
    # LLM 서비스 호출
    answer = await llm_service.get_qa_response(
      symbol=symbol.upper(),
      user_question=request_data.question,
      company_data=company_data,
      financial_data=financial_data,
      history_data=history_data,
      news_data=news_data,
      conversation_history=conversation_history
    )
    
    # 업데이트된 대화 히스토리 생성
    updated_history = list(request_data.conversation_history)
    
    # 사용자 질문 추가
    updated_history.append(ChatMessage(
      role="user",
      content=request_data.question,
      timestamp=datetime.now().isoformat()
    ))
    
    # AI 답변 추가
    updated_history.append(ChatMessage(
      role="assistant", 
      content=answer,
      timestamp=datetime.now().isoformat()
    ))
    
    # 최대 20개 메시지만 유지
    if len(updated_history) > 20:
      updated_history = updated_history[-20:]
    
    logger.info(f"David 질문 응답 완료: user_id={current_user.id}, symbol={symbol}")
    
    return LLMQuestionResponse(
      success=True,
      symbol=symbol.upper(),
      question=request_data.question,
      answer=answer,
      conversation_history=updated_history,
      context_used={
        "company_summary": False,
        "financial_summary": False, 
        "market_info": False,
        "price_history": False,
        "news_data": False
      },
      message="질문에 대한 답변이 완료되었습니다."
    )
    
  except Exception as e:
    logger.error(f"David AI 질문 처리 오류: user_id={current_user.id}, symbol={symbol}, error={e}")
    raise HTTPException(status_code=500, detail="AI 질문 처리 중 오류가 발생했습니다.")