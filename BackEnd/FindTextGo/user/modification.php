<?php
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
    // JSON 데이터 읽기
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // 입력값 확인
    $username = trim($data['username'] ?? '');
    $newPassword = trim($data['new_password'] ?? '');
    $newEmail = filter_var(trim($data['new_email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $newName = trim($data['new_name'] ?? '');

    if (!$username || !$newEmail || !$newName) {
        sendJsonResponse(400, '필수 입력값이 누락되었습니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();

    // 사용자 존재 여부 확인
    $checkUserStmt = $conn->prepare("SELECT user_id FROM members WHERE username = ?");
    $checkUserStmt->bind_param("s", $username);
    $checkUserStmt->execute();
    $checkUserStmt->store_result();

    if ($checkUserStmt->num_rows === 0) {
        sendJsonResponse(404, '해당 username을 가진 사용자가 없습니다.');
    }
    $checkUserStmt->close();

    // 비밀번호가 입력된 경우 해시 처리
    $hashedPassword = $newPassword ? password_hash($newPassword, PASSWORD_BCRYPT) : null;

    // SQL 쿼리 작성
    $sql = "UPDATE members SET email = ?, name = ?" . 
           ($hashedPassword ? ", password = ?" : "") .
           " WHERE username = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('쿼리 준비 중 오류 발생: ' . $conn->error);
    }

    // 매개변수 바인딩
    if ($hashedPassword) {
        $stmt->bind_param("ssss", $newEmail, $newName, $hashedPassword, $username);
    } else {
        $stmt->bind_param("sss", $newEmail, $newName, $username);
    }

    // 쿼리 실행
    if ($stmt->execute()) {
        sendJsonResponse(200, '회원 정보가 성공적으로 수정되었습니다.');
    } else {
        sendJsonResponse(500, '회원 정보 수정 중 오류가 발생했습니다.');
    }

    // 연결 종료
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    sendJsonResponse(500, '서버 오류: ' . $e->getMessage());
}
?>
