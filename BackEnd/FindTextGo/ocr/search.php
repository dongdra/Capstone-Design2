<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 0); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

// CORS 설정
header("Access-Control-Allow-Origin: *"); // 모든 도메인에서 요청을 허용, 필요에 따라 특정 도메인으로 제한 가능
header("Access-Control-Allow-Methods: POST, OPTIONS"); // 허용할 메소드 설정
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // 허용할 헤더 설정

// OPTIONS 메소드 요청에 대한 응답 처리 (CORS Preflight 요청 대응)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content 상태 코드 반환
    exit;
}

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수
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
    // php://input을 사용하여 JSON 데이터를 받아옵니다.
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // 입력값 확인 및 변수 설정
    $identifier = trim($data['identifier'] ?? ''); // 아이디 또는 이메일
    $password = trim($data['password'] ?? '');
    $searchTerm = trim($data['search_term'] ?? ''); // 검색어

    // 필수 입력값 확인
    if (!$identifier || !$password || !$searchTerm) {
        sendJsonResponse(400, '아이디/이메일, 비밀번호, 검색어를 모두 입력해야 합니다.');
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

    // 유저 ID 가져오기
    $user_id = $user['user_id'];

    // 사용자 소유 파일 ID 가져오기
    $fileSql = "SELECT file_id FROM file_uploads WHERE user_id = ?";
    $fileStmt = $conn->prepare($fileSql);

    if (!$fileStmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    $fileStmt->bind_param("i", $user_id);
    $fileStmt->execute();
    $fileResult = $fileStmt->get_result();

    // file_id 배열 생성
    $fileIds = [];
    while ($fileRow = $fileResult->fetch_assoc()) {
        $fileIds[] = $fileRow['file_id'];
    }

    // 파일 ID가 없으면 데이터 반환하지 않음
    if (empty($fileIds)) {
        sendJsonResponse(200, '검색 결과가 없습니다.');
    }

    // 파일 ID를 기준으로 OCR 데이터 검색
    $ocrSql = "SELECT ocr_id, file_id, page_number, extracted_text, coord_x, coord_y, coord_width, coord_height 
               FROM ocr_data 
               WHERE file_id IN (" . implode(',', array_fill(0, count($fileIds), '?')) . ") 
               AND extracted_text LIKE CONCAT('%', ?, '%')";
    
    $ocrStmt = $conn->prepare($ocrSql);

    if (!$ocrStmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    // 바인딩 변수 설정
    $types = str_repeat('i', count($fileIds)) . 's';
    $params = array_merge($fileIds, [$searchTerm]);
    $ocrStmt->bind_param($types, ...$params);

    $ocrStmt->execute();
    $ocrResult = $ocrStmt->get_result();

    // 검색 결과 배열 생성
    $ocrData = [];
    while ($ocrRow = $ocrResult->fetch_assoc()) {
        $ocrData[] = $ocrRow;
    }

    // 검색 결과가 없으면 데이터 반환하지 않음
    if (empty($ocrData)) {
        sendJsonResponse(200, '검색 결과가 없습니다.');
    }

    // OCR 데이터 응답
    sendJsonResponse(200, '검색 성공', $ocrData);

    // statement와 연결 종료
    $stmt->close();
    $fileStmt->close();
    $ocrStmt->close();
    $conn->close();

} catch (Exception $e) {
    // 예외 발생 시 에러 메시지 출력
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
