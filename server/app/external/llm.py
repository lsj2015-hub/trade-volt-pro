import openai
from typing import List, Dict, Any, Optional
import logging
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class LLMService:
  def __init__(self):
    self.settings = get_settings()
    self.client = openai.AsyncOpenAI(api_key=self.settings.openai_api_key)

  def _make_prompt(
    self, 
    symbol: str, 
    user_question: str, 
    company_data: str = "", 
    financial_data: str = "", 
    history_data: str = "", 
    news_data: str = "",
    conversation_history: List[Dict[str, str]] = None
  ) -> List[Dict[str, str]]:
    
    system_message_content = f"""
당신은 유능한 주식 분석 AI 'David'입니다. 제공된 데이터를 기반으로 명확하고 통찰있게 답변해주세요.

=== {symbol} 종목 분석 데이터 ===
📊 회사 기본 정보:
{company_data if company_data else "제공된 회사 정보 없음"}

💰 재무 정보:  
{financial_data if financial_data else "제공된 재무 정보 없음"}

📈 주가 히스토리:
{history_data if history_data else "제공된 주가 히스토리 없음"}

📰 최신 뉴스:
{news_data if news_data else "제공된 뉴스 데이터 없음"}

답변 시 주의사항:
- 제공된 실제 데이터만을 기반으로 답변하세요
- 투자 조언이 아닌 정보 분석 관점에서 답변하세요
- 불확실한 내용은 "제공된 데이터로는 판단하기 어렵습니다"라고 명시하세요
- 구체적인 숫자와 근거를 제시하며 설명하세요
- 한국어로 자연스럽게 답변하세요
"""
    
    # 메시지 구성
    messages = [{"role": "system", "content": system_message_content}]
    
    # 대화 히스토리 추가 (최근 10개만)
    if conversation_history:
      recent_history = conversation_history[-10:]
      for msg in recent_history:
        messages.append({
          "role": msg["role"],
          "content": msg["content"]
        })
    
    # 현재 질문 추가
    messages.append({"role": "user", "content": user_question})
    
    return messages

  async def get_qa_response(
    self, 
    symbol: str, 
    user_question: str, 
    company_data: str = "", 
    financial_data: str = "", 
    history_data: str = "", 
    news_data: str = "",
    conversation_history: List[Dict[str, str]] = None
  ) -> str:
    
    messages = self._make_prompt(
      symbol, user_question, company_data, financial_data, 
      history_data, news_data, conversation_history
    )
    
    try:
      logger.info(f"LLM 질문 요청: symbol={symbol}, question_length={len(user_question)}")
      
      response = await self.client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=1000
      )
      
      result = response.choices[0].message.content.strip()
      logger.info(f"LLM 응답 완료: response_length={len(result)}")
      
      return result
      
    except openai.OpenAIError as e:
      logger.error(f"OpenAI API 오류: {e}")
      raise e
    except Exception as e:
      logger.error(f"LLM 서비스 오류: {e}")
      raise e

# 싱글톤 인스턴스
llm_service = LLMService()