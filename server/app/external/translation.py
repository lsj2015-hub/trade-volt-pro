from deep_translator import GoogleTranslator
import logging

logger = logging.getLogger(__name__)

class TranslationService:
  def __init__(self):
    """번역 서비스 초기화"""
    self.max_length = 5000
    
  def translate_text(self, text: str, source_lang: str = 'auto', target_lang: str = 'ko') -> str:
    """텍스트 번역 (다국가 언어 지원)"""
    if not text or not text.strip():
      return ""
      
    try:
      # 텍스트가 너무 길면 나누어서 번역
      if len(text) > self.max_length:
        return self._translate_long_text(text, source_lang, target_lang)
      else:
        return GoogleTranslator(source=source_lang, target=target_lang).translate(text)
        
    except ImportError:
      logger.error("deep-translator 패키지가 설치되지 않았습니다.")
      return text
    except Exception as e:
      logger.error(f"번역 실패 ({source_lang} -> {target_lang}): {e}")
      return text  # 번역 실패 시 원문 반환
  
  def translate_to_korean(self, text: str) -> str:
    """한국어 번역 (기존 메서드 유지)"""
    return self.translate_text(text, 'auto', 'ko')
  
  def translate_to_english(self, text: str) -> str:
    """영어 번역"""
    return self.translate_text(text, 'auto', 'en')
  
  def _translate_long_text(self, text: str, source_lang: str, target_lang: str) -> str:
    """긴 텍스트 분할 번역"""
    sentences = text.split('. ')
    translated_sentences = []
    current_chunk = ""
    
    for sentence in sentences:
      if len(current_chunk + sentence) < self.max_length:
        current_chunk += sentence + ". "
      else:
        if current_chunk:
          translated = GoogleTranslator(source=source_lang, target=target_lang).translate(current_chunk.strip())
          translated_sentences.append(translated)
        current_chunk = sentence + ". "
    
    # 마지막 chunk 처리
    if current_chunk:
      translated = GoogleTranslator(source=source_lang, target=target_lang).translate(current_chunk.strip())
      translated_sentences.append(translated)
    
    return " ".join(translated_sentences)

# 싱글톤 인스턴스
translation_service = TranslationService()