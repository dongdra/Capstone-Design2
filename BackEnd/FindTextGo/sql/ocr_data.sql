CREATE TABLE ocr_data (
    ocr_id INT AUTO_INCREMENT PRIMARY KEY,       -- OCR 데이터 고유 ID, 자동 증가
    file_id INT NOT NULL,                        -- 파일 ID (file_info 테이블의 외래 키)
    page_number INT NOT NULL,                    -- 페이지 번호
    extracted_text TEXT,                         -- 추출된 텍스트
    coord_x INT,                                 -- 텍스트의 시작 X 좌표
    coord_y INT,                                 -- 텍스트의 시작 Y 좌표
    coord_width INT,                             -- 텍스트 영역의 너비
    coord_height INT,                            -- 텍스트 영역의 높이
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 데이터 생성 시간
    FOREIGN KEY (file_id) REFERENCES file_info(file_id) ON DELETE CASCADE
);
