import google.generativeai as genai
import argparse
import json
import re
import os

# Gemini API 설정
APIKEY = os.environ.get('API_KEY')
genai.configure(api_key=APIKEY)

def summarize_pdf(pdf_path):
    try:
        # PDF 파일 업로드
        uploaded_file = genai.upload_file(pdf_path)
        
        # 프롬프트 설정
        prompt = "You are the world's best summarizer. Summarize the following PDF file in JSON format with the 'summary' key. The summary should be in Korean and should be concise. Avoid mentioning the summarization method or style."

        # 모델 초기화
        model = genai.GenerativeModel('gemini-1.5-flash-002')

        # 내용 생성
        response = model.generate_content([uploaded_file, prompt])

        # 응답이 비어있는지 확인하고 출력
        if not response or not response.text:
            print("Error: Empty response from Gemini API")
            return
        
        # 응답에서 마크다운 형식 제거
        summary_response = re.sub(r'^```json|```$', '', response.text, flags=re.MULTILINE).strip()
        
        # JSON으로 파싱
        summary_data = json.loads(summary_response)
        print(json.dumps(summary_data, ensure_ascii=False, indent=4))
    
    except Exception as e:
        print(f"Error during summarization: {e}")

if __name__ == "__main__":
    # ArgumentParser 설정
    parser = argparse.ArgumentParser(description="PDF 파일을 요약합니다.")
    parser.add_argument("--pdf", required=True, help="요약할 PDF 파일 경로")
    
    args = parser.parse_args()
    
    # 요약 함수 호출
    summarize_pdf(args.pdf)
