<?php
// 에러 보고 수준 설정
// 실제 운영환경에서는 에러를 사용자에게 표시하지 않기 위해 주석 처리합니다.
// error_reporting(E_ALL);
// ini_set('display_errors', 0); 

// CORS 설정
header("Access-Control-Allow-Origin: *"); // 모든 도메인 허용
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization"); 

// OPTIONS 메소드에 대한 응답 처리 (CORS Preflight 요청 대응)
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

    // 변수 설정
    $identifier = trim($data['identifier'] ?? ''); // 아이디 또는 이메일
    $password = trim($data['password'] ?? '');
    $searchTerm = trim($data['search_term'] ?? ''); // 검색어 (태그 없는 경우)
    
    // 필수 입력값 확인
    if (!$identifier || !$password) {
        sendJsonResponse(400, '아이디/이메일, 비밀번호를 모두 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();

    // 사용자 인증
    $sql = "SELECT user_id, username, password FROM members WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0 || !password_verify($password, $result->fetch_assoc()['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 사용자 ID 가져오기
    $user_id = $result->fetch_assoc()['user_id'];

    // 기본 파일 정보 쿼리
    $fileSql = "SELECT fu.file_id, fu.file_name, fi.file_extension, fi.pdf_page_count, fi.file_size, fu.upload_date 
                FROM file_uploads fu
                JOIN file_info fi ON fu.file_id = fi.file_id
                WHERE fu.user_id = ?";
    
    // 조건 필터링
    $conditions = [];
    $params = [$user_id];
    $types = 'i';

    if ($searchTerm) {
        // 태그가 없는 경우 OCR 데이터 검색
        $ocrSql = "SELECT ocr_id, file_id, page_number, extracted_text, coord_x, coord_y, coord_width, coord_height 
                   FROM ocr_data 
                   WHERE file_id IN (SELECT file_id FROM file_uploads WHERE user_id = ?) 
                   AND extracted_text LIKE CONCAT('%', ?, '%')";
        $params[] = $searchTerm;
        $types .= 's';
    } else {
        // 태그만 있는 경우
        if (preg_match('/filetype:([\w,]+)/', $data['search_term'], $matches)) {
            $fileTypes = explode(',', $matches[1]);
            $conditions[] = "fi.file_extension IN (" . implode(',', array_fill(0, count($fileTypes), '?')) . ")";
            $params = array_merge($params, $fileTypes);
            $types .= str_repeat('s', count($fileTypes));
        }
        // 추가 조건 예시: 페이지 수, 크기 필터 등을 추가 가능
    }

    if ($conditions) {
        $fileSql .= " AND " . implode(' AND ', $conditions);
    }

    $fileStmt = $conn->prepare($fileSql);
    $fileStmt->bind_param($types, ...$params);
    $fileStmt->execute();
    $fileResult = $fileStmt->get_result();

    // 결과 배열 생성
    $fileData = [];
    while ($fileRow = $fileResult->fetch_assoc()) {
        $fileId = $fileRow['file_id'];
        $firstPagePath = "../documents/$fileId/webp/1.webp";

        // 첫 페이지 이미지 처리
        $firstPageBase64 = file_exists($firstPagePath) ? base64_encode(file_get_contents($firstPagePath)) : null;

        // 문서 정보 추가
        $fileData[] = [
            'file_name' => $fileRow['file_name'],
            'file_extension' => $fileRow['file_extension'],
            'pdf_page_count' => $fileRow['pdf_page_count'],
            'file_size' => $fileRow['file_size'],
            'upload_date' => $fileRow['upload_date'],
            'first_page_image' => $firstPageBase64
        ];
    }

    // 검색 결과가 없을 경우
    if (empty($fileData)) {
        sendJsonResponse(200, '검색 결과가 없습니다.');
    }

    // 결과 응답
    sendJsonResponse(200, '검색 성공', $fileData);

    // 자원 해제
    $stmt->close();
    $fileStmt->close();
    $conn->close();

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
