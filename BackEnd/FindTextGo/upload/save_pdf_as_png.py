# save_pdf_as_png.py
import sys
import os
from pdf2image import convert_from_path

def convert_pdf_to_png(pdf_path, output_dir):
    try:
        # PDF를 이미지로 변환
        images = convert_from_path(pdf_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        # 각 페이지를 PNG로 저장
        for i, page in enumerate(images):
            output_path = os.path.join(output_dir, f"{i + 1}.png")
            page.save(output_path, 'PNG')

        print("success")
    except Exception as e:
        print(f"error: {str(e)}")

if __name__ == "__main__":
    # 인자로 PDF 파일 경로와 저장할 디렉토리 경로를 받음
    if len(sys.argv) != 3:
        print("error: Invalid arguments")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    convert_pdf_to_png(pdf_path, output_dir)
