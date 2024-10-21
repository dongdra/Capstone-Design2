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
    $searchTerm = trim($data['search_term'] ?? '');
    
    // 필수 입력값 확인
    if (!$identifier || !$password) {
        sendJsonResponse(400, '아이디/이메일, 비밀번호를 모두 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception('데이터베이스 연결에 실패했습니다.');
    }

    // 사용자 인증
    $sql = "SELECT user_id, username, password FROM members WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
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

    // 검색 조건 초기화
    $conditions = [];
    $params = [$user_id];
    $types = 'i';

    // OCR 텍스트 검색 처리
    $ocrSearchTerm = null;
    if (preg_match("/text:'((?:[^'\\\\]|\\\\.)*?)'/", $searchTerm, $matches)) {
        $ocrSearchTerm = '%' . str_replace("''", "'", $matches[1]) . '%';
    }

    // 파일명 검색 처리
    if (preg_match("/filename:'((?:[^'\\\\]|\\\\.)*?)'/", $searchTerm, $matches)) {
        $filenameSearchTerm = str_replace("''", "'", $matches[1]);
        $filenameSearchTerm = str_replace('*', '%', $filenameSearchTerm);
        $conditions[] = "fu.file_name LIKE ?";
        $params[] = $filenameSearchTerm;
        $types .= 's';
    }

    // 여기에 다른 검색 조건 처리 로직 추가 (filetype, pages, upload, size 등)

    // 기본 파일 정보 쿼리
    $fileSql = "SELECT DISTINCT fu.file_id, fu.file_name, fi.file_extension, fi.pdf_page_count, fi.file_size, fu.upload_date 
                FROM file_uploads fu
                JOIN file_info fi ON fu.file_id = fi.file_id";

    // OCR 검색이 있는 경우 JOIN 추가
    if ($ocrSearchTerm !== null) {
        $fileSql .= " JOIN ocr_data od ON fu.file_id = od.file_id";
        $conditions[] = "od.extracted_text LIKE ?";
        $params[] = $ocrSearchTerm;
        $types .= 's';
    }

    $fileSql .= " WHERE fu.user_id = ?";

    // 조건 필터링 적용
    if (!empty($conditions)) {
        $fileSql .= " AND " . implode(' AND ', $conditions);
    }

    $fileStmt = $conn->prepare($fileSql);
    if (!$fileStmt) {
        throw new Exception('File statement 준비에 실패했습니다: ' . $conn->error);
    }

    if (!empty($params)) {
        $fileStmt->bind_param($types, ...$params);
    }
    $fileStmt->execute();
    $fileResult = $fileStmt->get_result();

    // 결과 배열 생성
    $fileData = [];
    while ($fileRow = $fileResult->fetch_assoc()) {
        $fileId = $fileRow['file_id'];
        $firstPagePath = "../documents/$fileId/webp/1.webp";

        // OCR 검색 결과 처리
        $ocrResults = [];
        if ($ocrSearchTerm !== null) {
            $ocrSql = "SELECT page_number, extracted_text, coord_x, coord_y, coord_width, coord_height 
                       FROM ocr_data 
                       WHERE file_id = ? AND extracted_text LIKE ?";
            $ocrStmt = $conn->prepare($ocrSql);
            if (!$ocrStmt) {
                throw new Exception('OCR statement 준비에 실패했습니다: ' . $conn->error);
            }
            $ocrStmt->bind_param('is', $fileId, $ocrSearchTerm);
            $ocrStmt->execute();
            $ocrResult = $ocrStmt->get_result();
            
            while ($ocrRow = $ocrResult->fetch_assoc()) {
                $ocrResults[] = [
                    'page_number' => $ocrRow['page_number'],
                    'extracted_text' => $ocrRow['extracted_text'],
                    'coordinates' => [
                        'x' => $ocrRow['coord_x'],
                        'y' => $ocrRow['coord_y'],
                        'width' => $ocrRow['coord_width'],
                        'height' => $ocrRow['coord_height']
                    ]
                ];
            }
            
            $ocrStmt->close();
        }

        // 첫 페이지 이미지 처리
        $firstPageBase64 = file_exists($firstPagePath) ? base64_encode(file_get_contents($firstPagePath)) : null;

        // 문서 정보 추가
        $fileInfo = [
            'file_id' => $fileId,
            'file_name' => $fileRow['file_name'],
            'file_extension' => $fileRow['file_extension'],
            'pdf_page_count' => $fileRow['pdf_page_count'],
            'file_size' => $fileRow['file_size'],
            'upload_date' => $fileRow['upload_date'],
            'first_page_image' => $firstPageBase64
        ];

        // OCR 결과가 있으면 추가
        if (!empty($ocrResults)) {
            $fileInfo['ocr_results'] = $ocrResults;
        }

        $fileData[] = $fileInfo;
    }

    // 검색 결과가 없을 경우
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
?>
