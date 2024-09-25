CREATE TABLE members (
    user_id INT AUTO_INCREMENT PRIMARY KEY,       -- 유저 고유번호, 자동 증가
    username VARCHAR(50) NOT NULL,               -- 아이디
    password VARCHAR(255) NOT NULL,              -- 비밀번호 (암호화된 값 저장 권장)
    email VARCHAR(100) NOT NULL,                 -- 이메일
    name VARCHAR(100) NOT NULL,                  -- 이름
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 가입일, 자동으로 현재 시간 저장
    is_active TINYINT(1) DEFAULT 1,              -- 사용 가능 여부 (1: 활성, 0: 비활성)
    memo TEXT,                                   -- 메모
    UNIQUE (username),                           -- 아이디는 중복 불가
    UNIQUE (email)                               -- 이메일은 중복 불가
);
