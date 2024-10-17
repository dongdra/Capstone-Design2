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
    $searchTerm = trim($data['search_term'] ?? ''); // 검색어가 없으면 빈 문자열로 설정
    
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

    if ($result->num_rows === 0) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 사용자 정보 가져오기
    $user = $result->fetch_assoc();

    // 비밀번호 확인
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 사용자 ID 가져오기
    $user_id = $user['user_id'];

    // 기본 파일 정보 쿼리 처리 (필터 적용 시)
    $fileSql = "SELECT fu.file_id, fu.file_name, fi.file_extension, fi.pdf_page_count, fi.file_size, fu.upload_date 
                FROM file_uploads fu
                JOIN file_info fi ON fu.file_id = fi.file_id
                WHERE fu.user_id = ?";

    // 조건 필터링
    $conditions = [];
    $params = [$user_id];
    $types = 'i';

    // 파일 형식 필터 처리 (filetype:pdf)
    if (preg_match('/filetype:(\w+)/', $searchTerm, $matches)) {
        $fileType = $matches[1];
        $conditions[] = "fi.file_extension = ?";
        $params[] = $fileType;
        $types .= 's'; // 문자열 파라미터 추가
    }

    // 페이지 수 필터 처리 (pages:<3, pages:<=3, pages:=3, pages:>=3, pages:>3, pages:300)
    if (preg_match('/pages:([<>]=?|=)?(\d+)/', $searchTerm, $matches)) {
        $operator = isset($matches[1]) && $matches[1] !== '' ? $matches[1] : '='; // Comparison operator (>, <, >=, <=, or =). Default to '=' if not specified.
        $pageCount = (int)$matches[2]; // Page count number
        $conditions[] = "fi.pdf_page_count $operator ?";
        $params[] = $pageCount;
        $types .= 'i'; // 정수 파라미터 추가
    }

    // 파일 업로드 날짜 필터 처리 (upload:20240901, upload:20240901-20241001)
    if (preg_match('/upload:(\d{8})(?:-(\d{8}))?/', $searchTerm, $matches)) {
        $startDate = $matches[1];
        $endDate = isset($matches[2]) ? $matches[2] : null;

        if ($endDate) {
            $conditions[] = "fu.upload_date BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= 'ss'; // 문자열 파라미터 두 개 추가
        } else {
            $conditions[] = "fu.upload_date = ?";
            $params[] = $startDate;
            $types .= 's'; // 문자열 파라미터 추가
        }
    }

    // 기존 파일 업로드 정보에서 조건 필터 처리
    if ($conditions) {
        $fileSql .= " AND " . implode(' AND ', $conditions);
    }

    $fileStmt = $conn->prepare($fileSql);
    if (!$fileStmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    // 바인딩 변수의 수를 맞춰 bind_param 호출
    if ($types) {
        $fileStmt->bind_param($types, ...$params);
    }
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
        sendJsonResponse(404, '검색 결과가 없습니다.');
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
