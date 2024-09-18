const { v4: uuidv4 } = require('uuid');
const connection = require('../../../db/db'); // db.js에서 MySQL 연결 불러오기
const { createUserFolder } = require('../../../utils/folderManager'); // folderManager에서 폴더 생성 함수 불러오기

// GET 요청 핸들러 (오류 반환)
exports.get_response = (params) => {
    console.log('Received GET request with params:', params);
    return {
        StatusCode: 405, // 메서드 허용되지 않음
        message: 'GET 요청은 허용되지 않습니다. POST 요청만 가능합니다.',
    };
};

// POST 요청 핸들러 (회원가입)
exports.post_response = async (data) => {
    const { username, email, password } = data;

    // 필수 정보 누락 시 예외 처리
    if (!username || !email || !password) {
        return {
            StatusCode: 400,
            message: '유효하지 않은 요청: 필수 정보가 누락되었습니다.',
        };
    }

    try {
        // UUID v4 값 생성 (소문자 변환, 충돌 방지)
        let userId;
        while (true) {
            userId = uuidv4().toLowerCase(); // 소문자로 변환
            const existingUser = await checkUserIdExists(userId);
            if (!existingUser) break; // 충돌이 없으면 UUID 사용
        }

        // 유저 정보를 DB에 삽입
        const query = 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)';
        await executeQuery(query, [userId, username, email, password]);

        // 폴더 생성 (폴더 생성 오류 발생 시 로그 출력)
        await createUserFolder(userId);

        return {
            StatusCode: 201,
            message: '회원가입 성공! 폴더가 생성되었습니다.',
            userId: userId
        };

    } catch (err) {
        console.error('회원가입 실패:', err);
        return {
            StatusCode: 500,
            message: '서버 오류: 회원가입 처리 중 문제가 발생했습니다.',
        };
    }
};

// DB에서 유저 UUID 존재 여부 확인 함수
async function checkUserIdExists(userId) {
    const query = 'SELECT id FROM users WHERE id = ?';
    const result = await executeQuery(query, [userId]);
    return result.length > 0;
}

// MySQL 쿼리 실행을 Promise로 처리하는 함수
function executeQuery(query, params) {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('DB 쿼리 오류:', err);
                return reject(err);
            }
            resolve(results);
        });
    });
}
