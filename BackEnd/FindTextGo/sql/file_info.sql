CREATE TABLE file_info (
    file_id INT AUTO_INCREMENT PRIMARY KEY,          -- 파일 고유 ID, 자동 증가
    file_hash VARCHAR(255) NOT NULL UNIQUE,          -- 파일 해시값 (예: SHA256)
    file_extension VARCHAR(50) NOT NULL,             -- 파일 확장자
    file_size BIGINT NOT NULL,                       -- 파일 크기 (바이트 단위)
    pdf_page_count INT DEFAULT 0,                    -- PDF 파일의 페이지 수
    image_processed_count INT DEFAULT 0,             -- 이미지 처리된 페이지 수
    ocr_processed_count INT DEFAULT 0                -- OCR 처리된 페이지 수
);
