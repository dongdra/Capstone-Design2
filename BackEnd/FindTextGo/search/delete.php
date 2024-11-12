<?php
// 에러 보고 설정
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS 설정
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// OPTIONS 메소드에 대한 응답 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수 정의
function sendJsonResponse($statusCode, $message, $data = null)
{
    header('Content-Type: application/json');
    $response = ['StatusCode' => $statusCode, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// POST 요청 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, 'POST 요청만 허용됩니다.');
}

try {
    // 입력 데이터 받아오기
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // 변수 초기화
    $identifier = trim($data['identifier'] ?? '');
    $password = trim($data['password'] ?? '');
    $file_id = (int)($data['file_id'] ?? 0);
    $file_name = trim($data['file_name'] ?? '');
    
    // 필수 입력값 확인
    if (!$identifier || !$password || !$file_id || !$file_name) {
        sendJsonResponse(400, '모든 필드(identifier, password, file_id, file_name)를 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception('데이터베이스 연결에 실패했습니다.');
    }

    // 사용자 인증
    $sql = "SELECT user_id, password FROM members WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Statement 준비에 실패했습니다: ' . $conn->error);
    }
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    $user = $result->fetch_assoc();
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    $user_id = $user['user_id'];

    // file_uploads에서 파일 삭제 쿼리
    $deleteSql = "DELETE FROM file_uploads WHERE user_id = ? AND file_id = ? AND file_name = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    if (!$deleteStmt) {
        throw new Exception('File statement 준비에 실패했습니다: ' . $conn->error);
    }
    $deleteStmt->bind_param('iis', $user_id, $file_id, $file_name);

    if ($deleteStmt->execute()) {
        if ($deleteStmt->affected_rows > 0) {
            sendJsonResponse(200, '파일이 성공적으로 삭제되었습니다.');
        } else {
            sendJsonResponse(404, '해당 파일을 찾을 수 없습니다.');
        }
    } else {
        throw new Exception('파일 삭제에 실패했습니다.');
    }
} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
} finally {
    // 자원 해제
    if (isset($stmt)) $stmt->close();
    if (isset($deleteStmt)) $deleteStmt->close();
    if (isset($conn)) $conn->close();
}
?>
