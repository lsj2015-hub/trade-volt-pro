from deep_translator import GoogleTranslator
import logging

logger = logging.getLogger(__name__)

class TranslationService:
  def translate_to_korean(self, text: str) -> str:
    if not text or not text.strip():
      return ""
      
    try:
      # 텍스트가 너무 길면 나누어서 번역 (Google Translator 제한)
      max_length = 5000
      if len(text) > max_length:
        # 문장 단위로 나누어 번역
        sentences = text.split('. ')
        translated_sentences = []
        
        current_chunk = ""
        for sentence in sentences:
          if len(current_chunk + sentence) < max_length:
            current_chunk += sentence + ". "
          else:
            if current_chunk:
              translated = GoogleTranslator(source='auto', target='ko').translate(current_chunk.strip())
              translated_sentences.append(translated)
            current_chunk = sentence + ". "
        
        # 마지막 chunk 처리
        if current_chunk:
          translated = GoogleTranslator(source='auto', target='ko').translate(current_chunk.strip())
          translated_sentences.append(translated)
        
        return " ".join(translated_sentences)
      else:
        return GoogleTranslator(source='auto', target='ko').translate(text)
        
    except Exception as e:
      logger.error(f"번역 실패: {e}")
      return text  # 번역 실패 시 원문 반환
    
# 싱글톤 인스턴스  
tranlation_service = TranslationService()