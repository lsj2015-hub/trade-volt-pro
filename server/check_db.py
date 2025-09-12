#!/usr/bin/env python3
"""
DB 상태 확인 스크립트 (독립 실행)
사용법: python3 check_db.py
"""

import asyncio
import sys
import os

# 경로 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def check_db_status():
    """DB 상태 확인"""
    print("=== Trade Volt Pro DB 상태 확인 ===")
    
    try:
        # strategy_crud import
        from app.crud.strategy_crud import strategy_crud
        
        # 실제 import된 파일 위치 확인
        import app.crud.strategy_crud as crud_module
        print(f"📁 Import 위치: {crud_module.__file__}")
        print(f"🔍 Available methods: {[method for method in dir(strategy_crud) if not method.startswith('_')]}")
        print()
        
        # 🔧 기존 메소드를 활용한 DB 상태 확인
        print("📊 기존 메소드를 활용한 DB 상태 확인:")
        print()
        
        # 1. 한국 시장 더 많은 종목 확인
        try:
            target_stocks_kr = await strategy_crud.get_target_stocks_for_analysis(
                country_identifier="KR", 
                market_identifier="KOSPI", 
                limit=20  # 더 많은 종목 조회
            )
            print(f"🇰🇷 한국-KOSPI 종목: {len(target_stocks_kr)}개")
            
            # 모든 종목 출력해서 일반 주식이 있는지 확인
            for stock in target_stocks_kr:
                symbol = stock['symbol']
                name = stock['company_name']
                # 일반 주식 코드인지 확인 (6자리 숫자)
                is_stock = symbol.isdigit() and len(symbol) == 6
                marker = "📈" if is_stock else "📦"
                print(f"  {marker} {symbol}: {name}")
            print()
        except Exception as e:
            print(f"🇰🇷 한국 종목 조회 실패: {str(e)}")
        
        # 2. 한국 코스닥 시장도 확인
        try:
            target_stocks_kosdaq = await strategy_crud.get_target_stocks_for_analysis(
                country_identifier="KR", 
                market_identifier="KOSDAQ", 
                limit=10
            )
            print(f"🇰🇷 한국-KOSDAQ 종목: {len(target_stocks_kosdaq)}개")
            for stock in target_stocks_kosdaq[:5]:
                print(f"  - {stock['symbol']}: {stock['company_name']}")
            print()
        except Exception as e:
            print(f"🇰🇷 코스닥 종목 조회 실패: {str(e)}")
        
        # 3. 미국 시장 확인  
        try:
            target_stocks_us = await strategy_crud.get_target_stocks_for_analysis(
                country_identifier="US", 
                market_identifier="NYSE", 
                limit=10
            )
            print(f"🇺🇸 미국-NYSE 종목: {len(target_stocks_us)}개")
            for stock in target_stocks_us:
                print(f"  - {stock['symbol']}: {stock['company_name']}")
            print()
        except Exception as e:
            print(f"🇺🇸 미국 종목 조회 실패: {str(e)}")
        
        # 4. 나스닥도 확인
        try:
            target_stocks_nasdaq = await strategy_crud.get_target_stocks_for_analysis(
                country_identifier="US", 
                market_identifier="NASDAQ", 
                limit=10
            )
            print(f"🇺🇸 미국-NASDAQ 종목: {len(target_stocks_nasdaq)}개")
            for stock in target_stocks_nasdaq[:5]:
                print(f"  - {stock['symbol']}: {stock['company_name']}")
            print()
        except Exception as e:
            print(f"🇺🇸 나스닥 종목 조회 실패: {str(e)}")
        
        # 5. 🔍 KIS API 실제 호출 테스트
        print("🔍 KIS API 실제 호출 테스트:")
        print()
        
        try:
            from app.external.kis_api import kis_api_service
            from datetime import date
            
            # 테스트할 종목들
            test_stocks = [
                {"symbol": "900110", "name": "이스트아시아홀딩스", "market_type": "DOMESTIC"},
                {"symbol": "AA", "name": "알코아", "market_type": "OVERSEAS"},
            ]
            
            for test_stock in test_stocks:
                symbol = test_stock["symbol"] 
                market_type = test_stock["market_type"]
                name = test_stock["name"]
                
                try:
                    print(f"📊 {symbol} ({name}) - {market_type} 일봉 데이터 조회 중...")
                    
                    # 실제 KIS API 호출 (2024년 12월 ~ 2025년 8월)
                    chart_data = await kis_api_service.get_daily_chart_data(
                        user_id=1,  # 임시 사용자 ID
                        symbol=symbol,
                        start_date="20241201",  
                        end_date="20250831",
                        market_type=market_type
                    )
                    
                    data_count = chart_data.get("data_count", 0)
                    chart_list = chart_data.get("chart_data", [])
                    
                    if data_count > 0:
                        print(f"   ✅ 성공: {data_count}개 일봉 데이터")
                        print(f"   📅 기간: {chart_data.get('period', 'N/A')}")
                        
                        # 처음 3개 데이터 샘플 출력
                        for i, daily in enumerate(chart_list[:3]):
                            date_str = daily.get('date', 'N/A')
                            close = daily.get('close_price', 0)
                            print(f"   📈 {date_str}: {close}")
                            
                    else:
                        print(f"   ❌ 실패: 데이터 없음")
                        
                    print()
                    
                except Exception as api_error:
                    print(f"   ❌ KIS API 오류: {str(api_error)}")
                    print()
                    
        except Exception as e:
            print(f"KIS API 테스트 실패: {str(e)}")
            
        print("=" * 50)
        
        # 6. 진단
        kospi_stocks = len(target_stocks_kr) if 'target_stocks_kr' in locals() else 0
        kosdaq_stocks = len(target_stocks_kosdaq) if 'target_stocks_kosdaq' in locals() else 0
        nyse_stocks = len(target_stocks_us) if 'target_stocks_us' in locals() else 0
        nasdaq_stocks = len(target_stocks_nasdaq) if 'target_stocks_nasdaq' in locals() else 0
        
        total_valid_stocks = kosdaq_stocks + nyse_stocks + nasdaq_stocks
        
        print("🏁 최종 진단:")
        print(f"   📦 KOSPI 펀드 종목: {kospi_stocks}개 (KIS API 조회 불가능)")
        print(f"   📈 KOSDAQ 일반 주식: {kosdaq_stocks}개 (KIS API 조회 가능)")  
        print(f"   📈 NYSE 일반 주식: {nyse_stocks}개 (KIS API 조회 가능)")
        print(f"   📈 NASDAQ 일반 주식: {nasdaq_stocks}개 (KIS API 조회 가능)")
        print(f"   🎯 실제 분석 가능: {total_valid_stocks}개")
        print()
        
        if total_valid_stocks == 0:
            print("❌ 문제: 분석 가능한 일반 주식 없음")
            print("💡 해결: 삼성전자(005930), 애플(AAPL) 등 유명 종목 DB 추가 필요")
        elif total_valid_stocks > 0:
            print(f"✅ {total_valid_stocks}개 분석 가능 종목 발견")
            print("🔍 변동성 분석 0개 원인은 KIS API 응답 또는 패턴 매칭 로직 문제일 가능성")
        else:
            print("❓ 알 수 없는 상태")
            
    except Exception as e:
        print(f"❌ DB 확인 실패: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_db_status())