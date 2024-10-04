<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 0); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
    header('Content-Type: application/json');
    echo json_encode(['StatusCode' => $statusCode, 'message' => $message]);
    exit;
}

// POST 요청 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, 'POST 요청만 허용됩니다.');
}

try {
    // php://input을 사용하여 JSON 데이터를 받아옵니다.
    $input = file_get_contents("php://input");

    // 필수 입력값 확인
    if (!$identifier || !$password) {
        sendJsonResponse(400, '아이디/이메일과 비밀번호를 모두 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();

    // SQL 쿼리 작성 - 아이디 또는 이메일로 사용자 검색
    $sql = "SELECT user_id, username, password, email, is_active FROM members 
            WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    // 쿼리에 바인딩
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();
    // 사용자 존재 여부 확인
    if ($result->num_rows === 0) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }
    // 사용자 정보 가져오기
    $user = $result->fetch_assoc();
    // 비밀번호 확인
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }
    // 로그인 성공 응답
    sendJsonResponse(200, 'Login successful');
    // statement와 연결 종료
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    // 예외 발생 시 에러 메시지 출력
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
