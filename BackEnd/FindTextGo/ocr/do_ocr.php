<?php
// 환경 변수를 불러오기 위해 dotenv 사용 (설치 필요: composer require vlucas/phpdotenv)
require_once '../vendor/autoload.php';

// .env 파일에서 환경 변수 불러오기
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// 데이터베이스 및 기본 설정 파일
require_once '../db/db_config.php';

// 상수 정의
define('CLOVA_OCR_API_URL', $_ENV['CLOVA_OCR_API_URL']);  // 네이버 클로바 OCR API URL
define('CLOVA_OCR_SECRET_KEY', $_ENV['CLOVA_OCR_SECRET_KEY']);  // 네이버 클로바 OCR Secret Key
define('DOCUMENTS_DIR', "../documents/");  // 문서 파일 저장 경로

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
    header('Content-Type: application/json');
    echo json_encode(['StatusCode' => $statusCode, 'message' => $message]);
    exit;
}

// Base64로 이미지 파일 인코딩하는 함수
function encodeImageToBase64($imagePath)
{
    $imageData = file_get_contents($imagePath);
    return base64_encode($imageData);
}

// 네이버 클로바 OCR API 호출 함수
function runClovaOCR($imagePath, $imageName)
{
    $apiUrl = CLOVA_OCR_API_URL;
    $secretKey = CLOVA_OCR_SECRET_KEY;

    // 현재 날짜와 시간을 기반으로 파일명을 설정
    $fileName = date('YmdHis') . "_" . $imageName;

    // 이미지 파일을 Base64로 인코딩
    $imageBase64 = encodeImageToBase64($imagePath);

    // API 요청을 위한 JSON 데이터 구성
    $requestJson = [
        'images' => [
            [
                'format' => 'png',  // 이미지 파일 포맷 (png 사용)
                'name' => $fileName,
                'data' => $imageBase64,  // Base64로 인코딩된 이미지 데이터
            ]
        ],
        'requestId' => uniqid(),  // 고유 요청 ID 생성
        'version' => 'V2',  // API 버전
        'lang' => 'ko, ja, zh-TW',  // 언어 설정
        'timestamp' => round(microtime(true) * 1000)  // 현재 타임스탬프 (밀리초)
    ];

    // cURL 초기화 및 설정
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);  // API URL 설정
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  // 응답 값을 반환하도록 설정
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-OCR-SECRET: ' . $secretKey,  // Secret Key를 헤더에 포함
        'Content-Type: application/json'  // 요청 데이터 형식 설정
    ]);

    // JSON 데이터 전송
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestJson));  // POST 필드 설정

    // API 호출 실행
    $response = curl_exec($ch);

    // 오류 처리: API 요청 실패 시 오류 메시지 반환
    if ($response === false) {
        sendJsonResponse(500, '클로바 OCR API 연결 실패: ' . curl_error($ch));
    }

    // cURL 세션 종료
    curl_close($ch);

    // 응답에서 불필요한 b'...' 부분 제거
    $response = trim($response, "b'");

    // JSON 응답 디버깅 출력
    error_log("API 응답: " . $response);

    // JSON 응답 파싱
    $responseData = json_decode($response, true);

    // JSON 파싱 중 오류가 발생하면 오류 메시지 반환
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonResponse(500, 'JSON 파싱 오류: ' . json_last_error_msg());
    }

    // 'images' 키가 존재하는지 확인
    if (!isset($responseData['images']) || !is_array($responseData['images'])) {
        sendJsonResponse(500, 'OCR 처리 중 오류가 발생했습니다. 응답 데이터에 images 키가 없습니다.');
    }

    // OCR 결과 반환 (인식된 텍스트 및 좌표 정보)
    return $responseData['images'][0]['fields'];
}

// OCR 결과를 데이터베이스에 저장하는 함수
function saveOCRData($conn, $fileId, $pageNumber, $ocrResult)
{
    // SQL INSERT 쿼리 (OCR 결과 데이터를 데이터베이스에 저장)
    $insertQuery = "INSERT INTO ocr_data (file_id, page_number, extracted_text, coord_x, coord_y, coord_width, coord_height) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);  // 준비된 문 (prepared statement) 사용

    // 쿼리 준비 실패 시 예외 발생
    if (!$stmt) {
        throw new Exception('쿼리 준비 실패: ' . $conn->error);
    }

    // OCR 결과를 반복하며 데이터베이스에 저장
    foreach ($ocrResult as $data) {
        $extractedText = $data['inferText'];  // 추출된 텍스트
        $coordX = $data['boundingPoly']['vertices'][0]['x'];  // 좌표 X
        $coordY = $data['boundingPoly']['vertices'][0]['y'];  // 좌표 Y
        $coordWidth = $data['boundingPoly']['vertices'][2]['x'] - $coordX;  // 너비 계산
        $coordHeight = $data['boundingPoly']['vertices'][2]['y'] - $coordY;  // 높이 계산

        // 데이터베이스에 데이터 삽입
        $stmt->bind_param("iisiiii", $fileId, $pageNumber, $extractedText, $coordX, $coordY, $coordWidth, $coordHeight);
        $stmt->execute();
    }

    // SQL 문 종료
    $stmt->close();
}

// 메인 OCR 처리 함수
function processOCR($conn)
{
    // OCR 처리가 필요한 파일을 가져오는 SQL 쿼리
    $query = "SELECT file_id, pdf_page_count FROM file_info WHERE ocr_processed_count != pdf_page_count LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();

    // 처리할 파일이 없을 경우
    if ($result->num_rows === 0) {
        sendJsonResponse(404, 'OCR 처리가 필요한 파일이 없습니다.');
    }

    // 가져온 파일 정보 저장
    $file = $result->fetch_assoc();
    $fileId = $file['file_id'];
    $pageCount = $file['pdf_page_count'];

    // 파일 경로 설정
    $fileDir = DOCUMENTS_DIR . $fileId;

    // 각 페이지별로 OCR 처리
    for ($page = 1; $page <= $pageCount; $page++) {
        $imagePath = "$fileDir/$page.png";  // 페이지별 이미지 경로

        // 이미지 파일이 존재하는지 확인
        if (!file_exists($imagePath)) {
            continue;  // 이미지가 없으면 다음 페이지로
        }

        // 네이버 클로바 OCR 호출하여 결과 받기 (현재 날짜와 파일명으로 처리)
        $ocrResult = runClovaOCR($imagePath, "$page.png");

        // OCR 처리 중 오류 발생 시
        if ($ocrResult === false || $ocrResult === null) {
            sendJsonResponse(500, 'OCR 처리 중 오류가 발생했습니다.');
        }

        // OCR 결과 데이터베이스에 저장
        saveOCRData($conn, $fileId, $page, $ocrResult);
    }

    // 모든 페이지 처리 후 ocr_processed_count 업데이트
    $updateQuery = "UPDATE file_info SET ocr_processed_count = ? WHERE file_id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("ii", $pageCount, $fileId);
    $updateStmt->execute();
    $updateStmt->close();

    // 성공 메시지 반환
    sendJsonResponse(200, 'OCR 처리가 완료되었습니다.');
}

// 메인 실행 부분 (OCR 처리 시작)
try {
    $conn = getDbConnection();  // 데이터베이스 연결
    processOCR($conn);  // OCR 처리 실행

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
