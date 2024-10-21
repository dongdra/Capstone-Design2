<?php
// 에러 보고 설정
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS 설정
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// OPTIONS 요청 처리 (CORS Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';

/**
 * JSON 응답을 반환하는 함수
 * @param int $statusCode HTTP 상태 코드
 * @param string $message 응답 메시지
 * @param mixed|null $data 추가 데이터 (선택적)
 */
function sendJsonResponse($statusCode, $message, $data = null)
{
    header('Content-Type: application/json');
    http_response_code($statusCode);
    $response = ['statusCode' => $statusCode, 'message' => $message];
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
    // 입력 데이터 받아오기 및 유효성 검사
    $input = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('잘못된 JSON 형식입니다.');
    }

    // 필수 입력값 확인
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');
    $searchTerm = trim($input['search_term'] ?? '');

    if (empty($identifier) || empty($password)) {
        sendJsonResponse(400, '아이디/이메일과 비밀번호를 모두 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();

    // 사용자 인증
    $stmt = $conn->prepare("SELECT user_id, username, password FROM members WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1");
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0 || !password_verify($password, $result->fetch_assoc()['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    $user = $result->fetch_assoc();
    $user_id = $user['user_id'];

    // 검색 조건 처리
    $conditions = [];
    $params = [$user_id];
    $types = 'i';

    // 검색 조건 함수들
    $searchConditions = [
        'processOcrSearch',
        'processFilenameSearch',
        'processFileTypeFilter',
        'processPageCountFilter',
        'processUploadDateFilter',
        'processFileSizeFilter'
    ];

    foreach ($searchConditions as $condition) {
        $result = $condition($searchTerm, $conditions, $params, $types);
        $conditions = $result['conditions'];
        $params = $result['params'];
        $types = $result['types'];
    }

    // 파일 정보 쿼리 구성
    $fileSql = "SELECT fu.file_id, fu.file_name, fi.file_extension, fi.pdf_page_count, fi.file_size, fu.upload_date 
                FROM file_uploads fu
                JOIN file_info fi ON fu.file_id = fi.file_id
                WHERE fu.user_id = ?";

    if (!empty($conditions)) {
        $fileSql .= " AND " . implode(' AND ', $conditions);
    }

    $fileStmt = $conn->prepare($fileSql);
    if (!$fileStmt) {
        throw new Exception('쿼리 준비 실패: ' . $conn->error);
    }

    $fileStmt->bind_param($types, ...$params);
    $fileStmt->execute();
    $fileResult = $fileStmt->get_result();

    $fileData = [];
    while ($fileRow = $fileResult->fetch_assoc()) {
        $fileId = $fileRow['file_id'];
        $firstPagePath = "../documents/$fileId/webp/1.webp";

        // OCR 검색 결과 처리
        $ocrResults = processOcrResults($conn, $fileId, $searchTerm);

        // 첫 페이지 이미지 처리
        $firstPageBase64 = file_exists($firstPagePath) ? base64_encode(file_get_contents($firstPagePath)) : null;

        $fileInfo = [
            'file_id' => $fileId,
            'file_name' => htmlspecialchars($fileRow['file_name']),
            'file_extension' => htmlspecialchars($fileRow['file_extension']),
            'pdf_page_count' => $fileRow['pdf_page_count'],
            'file_size' => $fileRow['file_size'],
            'upload_date' => $fileRow['upload_date'],
            'first_page_image' => $firstPageBase64
        ];

        if (!empty($ocrResults)) {
            $fileInfo['ocr_results'] = $ocrResults;
        }

        $fileData[] = $fileInfo;
    }

    // 검색 결과 확인
    if (empty($fileData)) {
        sendJsonResponse(404, '검색 결과가 없습니다.');
    }

    // 결과 응답
    sendJsonResponse(200, '검색 성공', $fileData);

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
} finally {
    // 자원 해제
    if (isset($stmt)) $stmt->close();
    if (isset($fileStmt)) $fileStmt->close();
    if (isset($conn)) $conn->close();
}

/**
 * OCR 검색 조건 처리
 */
function processOcrSearch($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match("/text:'((?:[^'\\\\]|\\\\.)*?)'/", $searchTerm, $matches)) {
        $ocrSearchTerm = '%' . str_replace("''", "'", $matches[1]) . '%';
        $conditions[] = "fu.file_id IN (SELECT file_id FROM ocr_data WHERE extracted_text LIKE ?)";
        $params[] = $ocrSearchTerm;
        $types .= 's';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * 파일명 검색 조건 처리
 */
function processFilenameSearch($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match("/filename:'((?:[^'\\\\]|\\\\.)*?)'/", $searchTerm, $matches)) {
        $filenameSearchTerm = str_replace(["''", "*"], ["'", "%"], $matches[1]);
        $conditions[] = "fu.file_name LIKE ?";
        $params[] = $filenameSearchTerm;
        $types .= 's';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * 파일 형식 필터 처리
 */
function processFileTypeFilter($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match('/filetype:(\w+)/', $searchTerm, $matches)) {
        $conditions[] = "fi.file_extension = ?";
        $params[] = $matches[1];
        $types .= 's';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * 페이지 수 필터 처리
 */
function processPageCountFilter($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match('/pages:([<>]=?|=)?(\d+)/', $searchTerm, $matches)) {
        $operator = !empty($matches[1]) ? $matches[1] : '=';
        $pageCount = (int)$matches[2];
        $conditions[] = "fi.pdf_page_count $operator ?";
        $params[] = $pageCount;
        $types .= 'i';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * 파일 업로드 날짜 필터 처리
 */
function processUploadDateFilter($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match('/upload:(\d{8})(?:-(\d{8}))?/', $searchTerm, $matches)) {
        $startDate = DateTime::createFromFormat('Ymd', $matches[1])->format('Y-m-d');
        $endDate = isset($matches[2]) ? DateTime::createFromFormat('Ymd', $matches[2])->format('Y-m-d 23:59:59') : $startDate . ' 23:59:59';
        $conditions[] = "fu.upload_date BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
        $types .= 'ss';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * 파일 크기 필터 처리
 */
function processFileSizeFilter($searchTerm, &$conditions, &$params, &$types)
{
    if (preg_match('/size:([<>]?=?)(\d+(?:\.\d+)?)\s*(KB|MB|GB)?/i', $searchTerm, $matches)) {
        $operator = !empty($matches[1]) ? $matches[1] : '=';
        $size = (float)$matches[2];
        $unit = strtoupper($matches[3] ?? 'B');
        
        switch ($unit) {
            case 'KB': $size *= 1024; break;
            case 'MB': $size *= 1024 * 1024; break;
            case 'GB': $size *= 1024 * 1024 * 1024; break;
        }
        
        $conditions[] = "fi.file_size $operator ?";
        $params[] = $size;
        $types .= 'd';
    }
    return ['conditions' => $conditions, 'params' => $params, 'types' => $types];
}

/**
 * OCR 결과 처리
 */
function processOcrResults($conn, $fileId, $searchTerm)
{
    $ocrResults = [];
    if (preg_match("/text:'((?:[^'\\\\]|\\\\.)*?)'/", $searchTerm, $matches)) {
        $ocrSearchTerm = '%' . str_replace("''", "'", $matches[1]) . '%';
        $ocrSql = "SELECT page_number, extracted_text, coord_x, coord_y, coord_width, coord_height 
                   FROM ocr_data 
                   WHERE file_id = ? AND extracted_text LIKE ?";
        $ocrStmt = $conn->prepare($ocrSql);
        $ocrStmt->bind_param('is', $fileId, $ocrSearchTerm);
        $ocrStmt->execute();
        $ocrResult = $ocrStmt->get_result();
        
        while ($ocrRow = $ocrResult->fetch_assoc()) {
            $ocrResults[] = $ocrRow;
        }
        
        $ocrStmt->close();
    }
    return $ocrResults;
}
?>
