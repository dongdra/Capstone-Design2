CREATE TABLE file_uploads (
    upload_id INT AUTO_INCREMENT PRIMARY KEY,           -- 업로드 기록의 고유 ID, 자동 증가
    file_id INT NOT NULL,                               -- file_info 테이블의 외래키
    user_id INT NOT NULL,                               -- members 테이블의 외래키, 업로드한 사용자 ID
    file_name VARCHAR(255) NOT NULL,                    -- 사용자별 업로드된 파일명
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 파일 업로드 일시
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 파일 수정 일시
    CONSTRAINT fk_file FOREIGN KEY (file_id) REFERENCES file_info(file_id) ON DELETE CASCADE, -- 파일 정보 테이블 연결, 삭제 시 연쇄 삭제
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES members(user_id) ON DELETE CASCADE    -- 회원 테이블 연결, 삭제 시 연쇄 삭제
);
